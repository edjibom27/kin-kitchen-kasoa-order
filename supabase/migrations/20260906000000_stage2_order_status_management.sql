-- KIN Kitchen — Stage 2: staff order-status management
--
-- Stage 1 let any staff/admin run a raw UPDATE on `orders.status` (and a raw
-- INSERT into `order_status_history`), with no transition validation and no
-- guarantee the two stayed in sync. Stage 2 closes that: update_order_status()
-- becomes the ONLY way an order's status can ever change. It validates the
-- transition against the real KIN Kitchen lifecycle, updates the order, and
-- records history atomically — all in one SECURITY DEFINER function, the
-- same pattern as create_order()/get_order() from Stage 1.
--
-- No tables, columns, or enum values are added/changed. Only two Stage 1
-- policies are removed (replaced by the function below), and one new
-- function is added.

-- ---------------------------------------------------------------------------
-- Remove the two policies that allowed bypassing the function
-- ---------------------------------------------------------------------------

drop policy if exists "orders: staff/admin update status" on public.orders;
drop policy if exists "order_status_history: staff/admin insert" on public.order_status_history;

-- No replacement UPDATE policy on `orders` and no replacement INSERT policy
-- on `order_status_history` — staff/admin retain their existing SELECT
-- policies from Stage 1 (unchanged), but writes to status now only happen
-- inside update_order_status(), which runs as the table owner and so is
-- unaffected by the missing client-facing policies.

-- ---------------------------------------------------------------------------
-- update_order_status()
--
-- Lifecycle enforced (order_status enum is unchanged from Stage 1):
--   pending    -> confirmed | cancelled
--   confirmed  -> preparing | cancelled
--   preparing  -> ready (pickup only) | out_for_delivery (delivery only) | cancelled
--   ready      -> completed        (pickup orders only)
--   out_for_delivery -> delivered  (delivery orders only)
--   delivered, completed, cancelled -> terminal, no further transitions
-- ---------------------------------------------------------------------------

create or replace function public.update_order_status(
  p_order_id uuid,
  p_new_status public.order_status
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders%rowtype;
  v_allowed boolean := false;
begin
  if not public.is_staff_or_admin(auth.uid()) then
    raise exception 'UNAUTHORIZED: you do not have permission to update order status';
  end if;

  select * into v_order from public.orders where id = p_order_id;
  if not found then
    raise exception 'ORDER_NOT_FOUND: no order matches that id';
  end if;

  v_allowed := case v_order.status
    when 'pending' then p_new_status in ('confirmed', 'cancelled')
    when 'confirmed' then p_new_status in ('preparing', 'cancelled')
    when 'preparing' then p_new_status in ('ready', 'out_for_delivery', 'cancelled')
    when 'ready' then p_new_status = 'completed'
    when 'out_for_delivery' then p_new_status = 'delivered'
    else false
  end;

  -- ready/completed is the pickup branch; out_for_delivery/delivered is the
  -- delivery branch. Reject a transition that doesn't match the order's type.
  if v_allowed and p_new_status in ('ready', 'completed') and v_order.order_type <> 'pickup' then
    v_allowed := false;
  end if;
  if v_allowed and p_new_status in ('out_for_delivery', 'delivered') and v_order.order_type <> 'delivery' then
    v_allowed := false;
  end if;

  if not v_allowed then
    raise exception 'INVALID_STATUS_TRANSITION: cannot move order from % to %', v_order.status, p_new_status;
  end if;

  update public.orders
  set status = p_new_status
  where id = p_order_id;

  insert into public.order_status_history (order_id, status, changed_by)
  values (p_order_id, p_new_status, auth.uid());

  select * into v_order from public.orders where id = p_order_id;

  return jsonb_build_object(
    'id', v_order.id,
    'order_number', v_order.order_number,
    'status', v_order.status,
    'updated_at', v_order.updated_at
  );
end;
$$;

-- Only signed-in staff/admin ever need this — anon is blocked at the grant
-- level as defense in depth, on top of the is_staff_or_admin() check inside.
revoke all on function public.update_order_status(uuid, public.order_status) from public;
grant execute on function public.update_order_status(uuid, public.order_status) to authenticated;
