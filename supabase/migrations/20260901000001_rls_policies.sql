-- KIN Kitchen — Stage 1: Row Level Security
--
-- General approach:
--   * RLS is enabled on every application table.
--   * Public reference data (categories, available menu items, restaurant
--     settings) is readable by anyone, including anonymous visitors.
--   * `orders` has NO insert policy at all: normal client roles (anon,
--     authenticated) can never insert a row directly. All order creation
--     goes through the SECURITY DEFINER `create_order()` function (next
--     migration), which validates everything server-side before writing.
--     A SECURITY DEFINER function owned by the table owner bypasses RLS
--     internally, so it can still write even though clients cannot.
--   * `user_roles` can only ever be written by an existing admin — this is
--     the guard against self-granted staff/admin access.

-- ---------------------------------------------------------------------------
-- has_role(): SECURITY DEFINER helper so RLS policies can check roles
-- without recursively re-querying a RLS-protected table from within a
-- policy (which is the classic footgun with role tables).
-- ---------------------------------------------------------------------------

create or replace function public.has_role(p_user_id uuid, p_role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = p_user_id
      and role = p_role
  );
$$;

create or replace function public.is_staff_or_admin(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.has_role(p_user_id, 'staff') or public.has_role(p_user_id, 'admin');
$$;

-- ---------------------------------------------------------------------------
-- Enable RLS everywhere
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.categories enable row level security;
alter table public.menu_items enable row level security;
alter table public.restaurant_settings enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.order_status_history enable row level security;

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------

create policy "profiles: users read own, staff/admin read all"
  on public.profiles for select
  using (auth.uid() = id or public.is_staff_or_admin(auth.uid()));

create policy "profiles: users update own"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- No public insert/delete policy — profile rows are created exclusively by
-- the handle_new_user() trigger (SECURITY DEFINER, bypasses RLS).

-- ---------------------------------------------------------------------------
-- user_roles — admin-only writes, closes the self-escalation hole
-- ---------------------------------------------------------------------------

create policy "user_roles: users read own, admin reads all"
  on public.user_roles for select
  using (auth.uid() = user_id or public.has_role(auth.uid(), 'admin'));

create policy "user_roles: admin only writes"
  on public.user_roles for insert
  with check (public.has_role(auth.uid(), 'admin'));

create policy "user_roles: admin only updates"
  on public.user_roles for update
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

create policy "user_roles: admin only deletes"
  on public.user_roles for delete
  using (public.has_role(auth.uid(), 'admin'));

-- ---------------------------------------------------------------------------
-- categories — public read, admin write
-- ---------------------------------------------------------------------------

create policy "categories: public read"
  on public.categories for select
  using (true);

create policy "categories: admin write"
  on public.categories for insert
  with check (public.has_role(auth.uid(), 'admin'));

create policy "categories: admin update"
  on public.categories for update
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

create policy "categories: admin delete"
  on public.categories for delete
  using (public.has_role(auth.uid(), 'admin'));

-- ---------------------------------------------------------------------------
-- menu_items — public read of available items, admin write
-- ---------------------------------------------------------------------------

create policy "menu_items: public read available, staff/admin read all"
  on public.menu_items for select
  using (is_available = true or public.is_staff_or_admin(auth.uid()));

create policy "menu_items: admin write"
  on public.menu_items for insert
  with check (public.has_role(auth.uid(), 'admin'));

create policy "menu_items: admin update"
  on public.menu_items for update
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

create policy "menu_items: admin delete"
  on public.menu_items for delete
  using (public.has_role(auth.uid(), 'admin'));

-- ---------------------------------------------------------------------------
-- restaurant_settings — public read (needed for delivery fee / prep time /
-- accepting-orders on the checkout page), admin write
-- ---------------------------------------------------------------------------

create policy "restaurant_settings: public read"
  on public.restaurant_settings for select
  using (true);

create policy "restaurant_settings: admin write"
  on public.restaurant_settings for insert
  with check (public.has_role(auth.uid(), 'admin'));

create policy "restaurant_settings: admin update"
  on public.restaurant_settings for update
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

-- ---------------------------------------------------------------------------
-- orders — owner + staff/admin read; NO client-side insert; staff/admin
-- only for status updates (customers can never modify order status)
-- ---------------------------------------------------------------------------

create policy "orders: owner or staff/admin read"
  on public.orders for select
  using (auth.uid() = user_id or public.is_staff_or_admin(auth.uid()));

-- Deliberately no INSERT policy: rows are created only via the
-- SECURITY DEFINER create_order() function. Guests (no user_id) retrieve
-- their own order afterwards via the SECURITY DEFINER get_order() function
-- using order_number + guest_token, not via a direct SELECT policy.

create policy "orders: staff/admin update status"
  on public.orders for update
  using (public.is_staff_or_admin(auth.uid()))
  with check (public.is_staff_or_admin(auth.uid()));

-- ---------------------------------------------------------------------------
-- order_items — visible to the parent order's owner or staff/admin; no
-- direct client writes (written only inside create_order())
-- ---------------------------------------------------------------------------

create policy "order_items: visible with parent order"
  on public.order_items for select
  using (
    exists (
      select 1
      from public.orders o
      where o.id = order_items.order_id
        and (o.user_id = auth.uid() or public.is_staff_or_admin(auth.uid()))
    )
  );

-- ---------------------------------------------------------------------------
-- order_status_history — visible to the parent order's owner or staff/admin;
-- staff/admin may append new rows (future status-update flow)
-- ---------------------------------------------------------------------------

create policy "order_status_history: visible with parent order"
  on public.order_status_history for select
  using (
    exists (
      select 1
      from public.orders o
      where o.id = order_status_history.order_id
        and (o.user_id = auth.uid() or public.is_staff_or_admin(auth.uid()))
    )
  );

create policy "order_status_history: staff/admin insert"
  on public.order_status_history for insert
  with check (public.is_staff_or_admin(auth.uid()));
