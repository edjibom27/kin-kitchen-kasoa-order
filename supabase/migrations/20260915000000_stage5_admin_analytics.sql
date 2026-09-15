-- KIN Kitchen — Stage 5: admin dashboard & business analytics
--
-- Six SECURITY DEFINER functions, admin-only (not staff — this is the first
-- capability in the app that staff does NOT automatically receive, unlike
-- Stage 3's menu management which is staff-or-admin). No new tables,
-- columns, enum values, or RLS policy changes: every function reads the
-- existing orders/order_items/menu_items/categories/profiles/user_roles
-- tables as the function owner (bypassing RLS internally, same pattern as
-- create_order()/get_order()/update_order_status()), so the browser never
-- receives more than pre-aggregated numbers — never raw order or customer
-- rows.
--
-- Revenue definition (applies everywhere revenue is calculated): only
-- orders with status 'delivered' or 'completed' — the two genuine
-- success-terminal states in the Stage 2 status graph (delivery's and
-- pickup's respective endpoints). Given this app's cash/MoMo-on-fulfillment
-- payment model, this is the closest available proxy for "the restaurant
-- was actually paid for this."
--
-- "Registered customers" / "total_customers" everywhere below deliberately
-- EXCLUDES any profile whose user_id also holds a 'staff' or 'admin' role.
-- handle_new_user() (Stage 1) creates a profiles row for every auth.users
-- signup regardless of how that account was provisioned, so a staff/admin
-- account provisioned normally would otherwise inflate the customer count.

-- ---------------------------------------------------------------------------
-- 1. admin_dashboard_overview()
-- ---------------------------------------------------------------------------

create or replace function public.admin_dashboard_overview(
  p_start timestamptz,
  p_end timestamptz
)
returns table (
  total_revenue numeric,
  total_orders bigint,
  average_order_value numeric,
  registered_customers bigint
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.has_role(auth.uid(), 'admin') then
    raise exception 'UNAUTHORIZED: admin access required';
  end if;

  if p_start is null or p_end is null or p_start > p_end then
    raise exception 'INVALID_DATE_RANGE: p_start must be less than or equal to p_end';
  end if;

  return query
  select
    coalesce(sum(o.total) filter (where o.status in ('delivered', 'completed')), 0)::numeric
      as total_revenue,
    count(*)::bigint as total_orders,
    case
      when count(*) filter (where o.status in ('delivered', 'completed')) = 0 then 0::numeric
      else round(
        coalesce(sum(o.total) filter (where o.status in ('delivered', 'completed')), 0)
          / count(*) filter (where o.status in ('delivered', 'completed')),
        2
      )
    end as average_order_value,
    (
      select count(*)::bigint
      from public.profiles p
      where p.id not in (
        select ur.user_id from public.user_roles ur where ur.role in ('staff', 'admin')
      )
    ) as registered_customers
  from public.orders o
  where o.created_at >= p_start and o.created_at <= p_end;
end;
$$;

revoke all on function public.admin_dashboard_overview(timestamptz, timestamptz) from public;
grant execute on function public.admin_dashboard_overview(timestamptz, timestamptz) to authenticated;

-- ---------------------------------------------------------------------------
-- 2. admin_revenue_series()
-- ---------------------------------------------------------------------------

create or replace function public.admin_revenue_series(
  p_start timestamptz,
  p_end timestamptz
)
returns table (
  bucket_date date,
  revenue numeric,
  order_count bigint
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.has_role(auth.uid(), 'admin') then
    raise exception 'UNAUTHORIZED: admin access required';
  end if;

  if p_start is null or p_end is null or p_start > p_end then
    raise exception 'INVALID_DATE_RANGE: p_start must be less than or equal to p_end';
  end if;

  -- Ghana (Africa/Accra) has no DST and is UTC+0 year-round, so bucketing by
  -- UTC calendar day already matches the correct local day boundary for
  -- this deployment — no timezone conversion needed.
  --
  -- generate_series(date::date, date::date, interval) has no direct date
  -- overload, so Postgres promotes the bounds to timestamp and returns
  -- timestamp rows — cast back to date explicitly or the declared
  -- `RETURNS TABLE(bucket_date date, ...)` will not match at execution time.
  return query
  select
    d.bucket_date::date,
    coalesce(sum(o.total) filter (where o.status in ('delivered', 'completed')), 0)::numeric
      as revenue,
    count(o.id) filter (where o.status in ('delivered', 'completed'))::bigint as order_count
  from generate_series(p_start::date, p_end::date, interval '1 day') as d(bucket_date)
  left join public.orders o
    on o.created_at::date = d.bucket_date::date
   and o.created_at >= p_start
   and o.created_at <= p_end
  group by d.bucket_date
  order by d.bucket_date;
end;
$$;

revoke all on function public.admin_revenue_series(timestamptz, timestamptz) from public;
grant execute on function public.admin_revenue_series(timestamptz, timestamptz) to authenticated;

-- ---------------------------------------------------------------------------
-- 3. admin_status_counts()
-- ---------------------------------------------------------------------------

create or replace function public.admin_status_counts(
  p_start timestamptz,
  p_end timestamptz
)
returns table (
  status public.order_status,
  order_count bigint
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.has_role(auth.uid(), 'admin') then
    raise exception 'UNAUTHORIZED: admin access required';
  end if;

  if p_start is null or p_end is null or p_start > p_end then
    raise exception 'INVALID_DATE_RANGE: p_start must be less than or equal to p_end';
  end if;

  -- Left join against every enum value so a status with zero orders in
  -- range still appears as a 0 row rather than being silently omitted.
  return query
  select
    s.status,
    count(o.id)::bigint as order_count
  from unnest(enum_range(null::public.order_status)) as s(status)
  left join public.orders o
    on o.status = s.status
   and o.created_at >= p_start
   and o.created_at <= p_end
  group by s.status
  order by s.status;
end;
$$;

revoke all on function public.admin_status_counts(timestamptz, timestamptz) from public;
grant execute on function public.admin_status_counts(timestamptz, timestamptz) to authenticated;

-- ---------------------------------------------------------------------------
-- 4. admin_best_selling_items()
-- ---------------------------------------------------------------------------

create or replace function public.admin_best_selling_items(
  p_start timestamptz,
  p_end timestamptz,
  p_limit int default 10
)
returns table (
  item_name text,
  quantity_sold bigint,
  revenue numeric
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_limit int;
begin
  if not public.has_role(auth.uid(), 'admin') then
    raise exception 'UNAUTHORIZED: admin access required';
  end if;

  if p_start is null or p_end is null or p_start > p_end then
    raise exception 'INVALID_DATE_RANGE: p_start must be less than or equal to p_end';
  end if;

  -- Clamp rather than reject: a caller passing 0, a negative number, or an
  -- unreasonably large limit gets a sane result instead of an error.
  v_limit := greatest(1, least(coalesce(p_limit, 10), 100));

  -- Grouped by the item_name SNAPSHOT stored on order_items at order time
  -- (not menu_items.id) — this is exactly why Stage 1 stored that snapshot:
  -- it keeps working correctly even after the menu item itself is deleted
  -- (order_items.menu_item_id references menu_items(id) on delete set
  -- null), which grouping by id would break.
  return query
  select
    oi.item_name,
    sum(oi.quantity)::bigint as quantity_sold,
    sum(oi.line_total)::numeric as revenue
  from public.order_items oi
  join public.orders o on o.id = oi.order_id
  where o.status in ('delivered', 'completed')
    and o.created_at >= p_start
    and o.created_at <= p_end
  group by oi.item_name
  order by quantity_sold desc, revenue desc
  limit v_limit;
end;
$$;

revoke all on function public.admin_best_selling_items(timestamptz, timestamptz, int) from public;
grant execute on function public.admin_best_selling_items(timestamptz, timestamptz, int) to authenticated;

-- ---------------------------------------------------------------------------
-- 5. admin_category_sales()
-- ---------------------------------------------------------------------------

create or replace function public.admin_category_sales(
  p_start timestamptz,
  p_end timestamptz
)
returns table (
  category_name text,
  revenue numeric,
  quantity_sold bigint
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.has_role(auth.uid(), 'admin') then
    raise exception 'UNAUTHORIZED: admin access required';
  end if;

  if p_start is null or p_end is null or p_start > p_end then
    raise exception 'INVALID_DATE_RANGE: p_start must be less than or equal to p_end';
  end if;

  -- categories can never actually be deleted while a menu_item still
  -- references them (Stage 1 declared menu_items.category_id ... on delete
  -- restrict). The real "discontinued" case is a DELETED MENU ITEM: its
  -- order_items rows keep their item_name/price snapshot, but
  -- order_items.menu_item_id is set to null (on delete set null), so the
  -- join to menu_items/categories below naturally comes back null for
  -- those historical line items — coalesce() buckets them clearly rather
  -- than silently dropping that revenue from the totals.
  return query
  select
    coalesce(c.name, 'Discontinued items') as category_name,
    sum(oi.line_total)::numeric as revenue,
    sum(oi.quantity)::bigint as quantity_sold
  from public.order_items oi
  join public.orders o on o.id = oi.order_id
  left join public.menu_items mi on mi.id = oi.menu_item_id
  left join public.categories c on c.id = mi.category_id
  where o.status in ('delivered', 'completed')
    and o.created_at >= p_start
    and o.created_at <= p_end
  group by coalesce(c.name, 'Discontinued items')
  order by revenue desc;
end;
$$;

revoke all on function public.admin_category_sales(timestamptz, timestamptz) from public;
grant execute on function public.admin_category_sales(timestamptz, timestamptz) to authenticated;

-- ---------------------------------------------------------------------------
-- 6. admin_customer_insights()
-- ---------------------------------------------------------------------------

create or replace function public.admin_customer_insights(
  p_start timestamptz,
  p_end timestamptz
)
returns table (
  total_customers bigint,
  new_customers_in_period bigint,
  customers_with_orders bigint,
  returning_customers bigint,
  avg_orders_per_customer numeric
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_total_customers bigint;
  v_customer_order_count bigint;
begin
  if not public.has_role(auth.uid(), 'admin') then
    raise exception 'UNAUTHORIZED: admin access required';
  end if;

  if p_start is null or p_end is null or p_start > p_end then
    raise exception 'INVALID_DATE_RANGE: p_start must be less than or equal to p_end';
  end if;

  select count(*) into v_total_customers
  from public.profiles p
  where p.id not in (
    select ur.user_id from public.user_roles ur where ur.role in ('staff', 'admin')
  );

  select count(*) into v_customer_order_count
  from public.orders o
  where o.user_id is not null
    and o.user_id not in (
      select ur.user_id from public.user_roles ur where ur.role in ('staff', 'admin')
    );

  return query
  select
    v_total_customers as total_customers,
    (
      select count(*)::bigint
      from public.profiles p
      where p.created_at >= p_start
        and p.created_at <= p_end
        and p.id not in (
          select ur.user_id from public.user_roles ur where ur.role in ('staff', 'admin')
        )
    ) as new_customers_in_period,
    (
      select count(distinct o.user_id)::bigint
      from public.orders o
      where o.user_id is not null
        and o.user_id not in (
          select ur.user_id from public.user_roles ur where ur.role in ('staff', 'admin')
        )
    ) as customers_with_orders,
    (
      select count(*)::bigint
      from (
        select o.user_id
        from public.orders o
        where o.user_id is not null
          and o.user_id not in (
            select ur.user_id from public.user_roles ur where ur.role in ('staff', 'admin')
          )
        group by o.user_id
        having count(*) > 1
      ) repeat_customers
    ) as returning_customers,
    case
      when v_total_customers = 0 then 0::numeric
      else round(v_customer_order_count::numeric / v_total_customers, 2)
    end as avg_orders_per_customer;
end;
$$;

revoke all on function public.admin_customer_insights(timestamptz, timestamptz) from public;
grant execute on function public.admin_customer_insights(timestamptz, timestamptz) to authenticated;
