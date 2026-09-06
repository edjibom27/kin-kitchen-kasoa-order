-- KIN Kitchen — Stage 1: server-authoritative order creation
--
-- create_order() is the ONLY way rows ever land in `orders` / `order_items`.
-- It is SECURITY DEFINER (bypasses RLS as the owning role) and does every
-- check itself, so it is safe to grant EXECUTE to anon + authenticated:
--   * confirms the restaurant is currently accepting orders
--   * looks up every submitted line item by id and re-reads its CURRENT
--     price and availability from menu_items — client-submitted prices,
--     subtotal, delivery fee and total are never trusted or even accepted
--     as input
--   * computes subtotal / delivery fee / total / prep time itself
--   * generates a guaranteed-unique order number from a dedicated sequence
--   * inserts the order + its line items in a single transaction (a
--     function body is already transactional — if any check raises, the
--     whole thing rolls back)
--
-- get_order() is the read-side counterpart used by the order-confirmation
-- page. Orders have no public/guest SELECT policy (see previous migration),
-- so a guest with no account authenticates the request with the
-- (order_number, guest_token) pair returned by create_order() instead.

-- ---------------------------------------------------------------------------
-- Unique order numbers
-- ---------------------------------------------------------------------------

create sequence public.order_number_seq start 1;

create or replace function public.generate_order_number()
returns text
language sql
as $$
  select 'KIN-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('public.order_number_seq')::text, 5, '0');
$$;

-- ---------------------------------------------------------------------------
-- create_order()
-- ---------------------------------------------------------------------------

create or replace function public.create_order(
  p_customer_name text,
  p_phone text,
  p_order_type public.order_type,
  p_address text,
  p_landmark text,
  p_payment_method public.payment_method,
  p_momo_number text,
  -- [{ "menu_item_id": "<uuid>", "quantity": <int> }, ...]
  p_items jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_settings public.restaurant_settings%rowtype;
  v_user_id uuid;
  v_order_id uuid;
  v_order_number text;
  v_subtotal numeric(10, 2) := 0;
  v_delivery_fee numeric(10, 2) := 0;
  v_total numeric(10, 2) := 0;
  v_prep_minutes int;
  v_item jsonb;
  v_menu_item public.menu_items%rowtype;
  v_quantity int;
  v_guest_token uuid;
  v_result jsonb;
begin
  v_user_id := auth.uid();

  if trim(coalesce(p_customer_name, '')) = '' then
    raise exception 'INVALID_INPUT: customer name is required';
  end if;

  if trim(coalesce(p_phone, '')) = '' then
    raise exception 'INVALID_INPUT: phone number is required';
  end if;

  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'EMPTY_CART: no items were submitted';
  end if;

  select * into v_settings
  from public.restaurant_settings
  order by updated_at desc
  limit 1;

  if not found then
    raise exception 'RESTAURANT_SETTINGS_MISSING: no restaurant_settings row exists';
  end if;

  if not v_settings.is_accepting_orders then
    raise exception 'RESTAURANT_NOT_ACCEPTING_ORDERS: the restaurant is not currently accepting orders';
  end if;

  if p_order_type = 'delivery' and length(trim(coalesce(p_address, ''))) < 5 then
    raise exception 'DELIVERY_ADDRESS_REQUIRED: a delivery address is required for delivery orders';
  end if;

  if p_payment_method = 'momo' and length(trim(coalesce(p_momo_number, ''))) = 0 then
    raise exception 'MOMO_NUMBER_REQUIRED: a Mobile Money number is required for momo payment';
  end if;

  -- Pass 1: validate every line item and accumulate the server-computed
  -- subtotal. Nothing is written yet.
  for v_item in select * from jsonb_array_elements(p_items)
  loop
    if v_item ->> 'menu_item_id' is null then
      raise exception 'INVALID_ITEM: menu_item_id is required for every line item';
    end if;

    begin
      select * into v_menu_item
      from public.menu_items
      where id = (v_item ->> 'menu_item_id')::uuid;
    exception when invalid_text_representation then
      raise exception 'INVALID_ITEM: menu_item_id "%" is not a valid id', v_item ->> 'menu_item_id';
    end;

    if not found then
      raise exception 'MENU_ITEM_NOT_FOUND: menu item "%" does not exist', v_item ->> 'menu_item_id';
    end if;

    if not v_menu_item.is_available then
      raise exception 'MENU_ITEM_UNAVAILABLE: "%" is currently unavailable', v_menu_item.name;
    end if;

    v_quantity := nullif(v_item ->> 'quantity', '')::int;
    if v_quantity is null or v_quantity <= 0 then
      raise exception 'INVALID_QUANTITY: quantity for "%" must be a positive integer', v_menu_item.name;
    end if;

    v_subtotal := v_subtotal + (v_menu_item.price * v_quantity);
  end loop;

  if p_order_type = 'delivery' then
    v_delivery_fee := v_settings.delivery_fee;
    v_prep_minutes := v_settings.delivery_prep_minutes;
  else
    v_delivery_fee := 0;
    v_prep_minutes := v_settings.pickup_prep_minutes;
  end if;

  v_total := v_subtotal + v_delivery_fee;
  v_order_number := public.generate_order_number();
  v_guest_token := gen_random_uuid();

  insert into public.orders (
    order_number, user_id, guest_token, customer_name, phone, order_type,
    address, landmark, payment_method, momo_number,
    subtotal, delivery_fee, total, status, prep_time_minutes
  ) values (
    v_order_number,
    v_user_id,
    v_guest_token,
    trim(p_customer_name),
    trim(p_phone),
    p_order_type,
    case when p_order_type = 'delivery' then p_address else null end,
    nullif(trim(coalesce(p_landmark, '')), ''),
    p_payment_method,
    case when p_payment_method = 'momo' then p_momo_number else null end,
    v_subtotal,
    v_delivery_fee,
    v_total,
    'pending',
    v_prep_minutes
  )
  returning id into v_order_id;

  -- Pass 2: re-read each item and write the snapshot line items. Re-reading
  -- (rather than caching pass-1 rows) keeps this correct even if a future
  -- version of this function is extended with per-item locking.
  for v_item in select * from jsonb_array_elements(p_items)
  loop
    select * into v_menu_item
    from public.menu_items
    where id = (v_item ->> 'menu_item_id')::uuid;

    v_quantity := (v_item ->> 'quantity')::int;

    insert into public.order_items (order_id, menu_item_id, item_name, unit_price, quantity, line_total)
    values (
      v_order_id,
      v_menu_item.id,
      v_menu_item.name,
      v_menu_item.price,
      v_quantity,
      v_menu_item.price * v_quantity
    );
  end loop;

  insert into public.order_status_history (order_id, status, changed_by)
  values (v_order_id, 'pending', v_user_id);

  select jsonb_build_object(
    'id', o.id,
    'order_number', o.order_number,
    'guest_token', o.guest_token,
    'customer_name', o.customer_name,
    'phone', o.phone,
    'order_type', o.order_type,
    'address', o.address,
    'landmark', o.landmark,
    'payment_method', o.payment_method,
    'momo_number', o.momo_number,
    'subtotal', o.subtotal,
    'delivery_fee', o.delivery_fee,
    'total', o.total,
    'status', o.status,
    'prep_time_minutes', o.prep_time_minutes,
    'created_at', o.created_at,
    'items', (
      select jsonb_agg(jsonb_build_object(
        'id', oi.id,
        'menu_item_id', oi.menu_item_id,
        'item_name', oi.item_name,
        'unit_price', oi.unit_price,
        'quantity', oi.quantity,
        'line_total', oi.line_total
      ) order by oi.id)
      from public.order_items oi
      where oi.order_id = o.id
    )
  )
  into v_result
  from public.orders o
  where o.id = v_order_id;

  return v_result;
end;
$$;

-- Safe to expose: every check above runs regardless of caller, and no raw
-- table INSERT privilege on orders/order_items is granted to these roles.
grant execute on function public.create_order(
  text, text, public.order_type, text, text, public.payment_method, text, jsonb
) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- get_order(): read-side lookup for the order-confirmation page.
-- Authenticated owners are matched by auth.uid(); guests must supply the
-- guest_token that was returned by create_order().
-- ---------------------------------------------------------------------------

create or replace function public.get_order(
  p_order_number text,
  p_guest_token uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders%rowtype;
  v_result jsonb;
begin
  select * into v_order
  from public.orders
  where order_number = p_order_number;

  if not found then
    raise exception 'ORDER_NOT_FOUND: no order matches that order number';
  end if;

  if v_order.user_id is not null then
    if auth.uid() is null or auth.uid() <> v_order.user_id then
      raise exception 'UNAUTHORIZED: you do not have access to this order';
    end if;
  else
    if p_guest_token is null or p_guest_token <> v_order.guest_token then
      raise exception 'UNAUTHORIZED: you do not have access to this order';
    end if;
  end if;

  select jsonb_build_object(
    'id', o.id,
    'order_number', o.order_number,
    'guest_token', o.guest_token,
    'customer_name', o.customer_name,
    'phone', o.phone,
    'order_type', o.order_type,
    'address', o.address,
    'landmark', o.landmark,
    'payment_method', o.payment_method,
    'momo_number', o.momo_number,
    'subtotal', o.subtotal,
    'delivery_fee', o.delivery_fee,
    'total', o.total,
    'status', o.status,
    'prep_time_minutes', o.prep_time_minutes,
    'created_at', o.created_at,
    'items', (
      select jsonb_agg(jsonb_build_object(
        'id', oi.id,
        'menu_item_id', oi.menu_item_id,
        'item_name', oi.item_name,
        'unit_price', oi.unit_price,
        'quantity', oi.quantity,
        'line_total', oi.line_total
      ) order by oi.id)
      from public.order_items oi
      where oi.order_id = o.id
    )
  )
  into v_result
  from public.orders o
  where o.id = v_order.id;

  return v_result;
end;
$$;

grant execute on function public.get_order(text, uuid) to anon, authenticated;
