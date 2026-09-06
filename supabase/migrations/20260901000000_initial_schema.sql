-- KIN Kitchen — Stage 1: core schema
-- Enums, tables, constraints, indexes, timestamps.
-- No RLS here (see 20260901000001_rls_policies.sql) and no business-logic
-- functions here (see 20260901000002_order_functions.sql).

create extension if not exists "pgcrypto"; -- gen_random_uuid()

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------

create type public.app_role as enum ('customer', 'staff', 'admin');

create type public.order_type as enum ('delivery', 'pickup');

create type public.payment_method as enum ('cash', 'momo');

create type public.order_status as enum (
  'pending',
  'confirmed',
  'preparing',
  'ready',
  'out_for_delivery',
  'delivered',
  'completed',
  'cancelled'
);

-- ---------------------------------------------------------------------------
-- profiles (1:1 with auth.users)
-- ---------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  phone text,
  default_address text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is
  'One row per authenticated user. Guest checkout does not create a profile.';

-- Auto-create a profile row whenever a new auth user is created, so the
-- table is always in sync without the app having to remember to do it.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, phone)
  values (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'phone'
  )
  on conflict (id) do nothing;

  -- Every new user starts as a plain customer. Staff/admin roles are never
  -- self-assigned — see the user_roles table and its RLS policies.
  insert into public.user_roles (user_id, role)
  values (new.id, 'customer')
  on conflict (user_id, role) do nothing;

  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- user_roles (never store roles directly on profiles)
-- ---------------------------------------------------------------------------

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);

create index user_roles_user_id_idx on public.user_roles (user_id);

-- Now that user_roles exists, attach the trigger from handle_new_user().
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- categories
-- ---------------------------------------------------------------------------

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- menu_items
-- ---------------------------------------------------------------------------

create table public.menu_items (
  id uuid primary key default gen_random_uuid(),
  -- Stable, human-readable key matching the original frontend's static ids
  -- (e.g. "gh-jollof-chicken"). Kept for readability/back-compat; the real
  -- primary key used everywhere else is the uuid `id`.
  slug text not null unique,
  category_id uuid not null references public.categories (id) on delete restrict,
  name text not null,
  description text not null default '',
  price numeric(10, 2) not null check (price >= 0),
  -- References a bundled frontend asset key for Stage 1 (no Storage yet).
  -- e.g. "jollof", "burger", "pizza" — matches src/assets/*.jpg imports.
  image_key text not null,
  is_featured boolean not null default false,
  is_available boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index menu_items_category_id_idx on public.menu_items (category_id);
create index menu_items_is_available_idx on public.menu_items (is_available);
create index menu_items_is_featured_idx on public.menu_items (is_featured) where is_featured;

-- ---------------------------------------------------------------------------
-- restaurant_settings (singleton row)
-- ---------------------------------------------------------------------------

create table public.restaurant_settings (
  id uuid primary key default gen_random_uuid(),
  delivery_fee numeric(10, 2) not null check (delivery_fee >= 0),
  delivery_prep_minutes int not null check (delivery_prep_minutes > 0),
  pickup_prep_minutes int not null check (pickup_prep_minutes > 0),
  is_accepting_orders boolean not null default true,
  opening_hours jsonb,
  updated_at timestamptz not null default now()
);

comment on table public.restaurant_settings is
  'Single-row config table. The app always reads the most recently created row.';

-- ---------------------------------------------------------------------------
-- orders
-- ---------------------------------------------------------------------------

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  user_id uuid references auth.users (id) on delete set null, -- null = guest order
  -- Random per-order secret that lets a guest (no account) retrieve their
  -- own order confirmation without exposing every order to anyone who can
  -- guess an order number. See get_order() in order_functions migration.
  guest_token uuid not null default gen_random_uuid(),
  customer_name text not null,
  phone text not null,
  order_type public.order_type not null,
  address text,
  landmark text,
  payment_method public.payment_method not null,
  momo_number text,
  subtotal numeric(10, 2) not null check (subtotal >= 0),
  delivery_fee numeric(10, 2) not null check (delivery_fee >= 0),
  total numeric(10, 2) not null check (total >= 0),
  status public.order_status not null default 'pending',
  prep_time_minutes int not null check (prep_time_minutes > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint orders_delivery_address_required check (
    order_type <> 'delivery' or (address is not null and length(trim(address)) >= 5)
  ),
  constraint orders_momo_number_required check (
    payment_method <> 'momo' or (momo_number is not null and length(trim(momo_number)) > 0)
  )
);

create index orders_user_id_idx on public.orders (user_id);
create index orders_status_idx on public.orders (status);
create index orders_order_number_idx on public.orders (order_number);
create index orders_created_at_idx on public.orders (created_at desc);

-- ---------------------------------------------------------------------------
-- order_items
-- ---------------------------------------------------------------------------

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  -- Kept as a reference for reporting, but every priced field below is a
  -- snapshot taken at order time — menu_items can change price/name later
  -- without altering historical orders.
  menu_item_id uuid references public.menu_items (id) on delete set null,
  item_name text not null,
  unit_price numeric(10, 2) not null check (unit_price >= 0),
  quantity int not null check (quantity > 0),
  line_total numeric(10, 2) not null check (line_total >= 0)
);

create index order_items_order_id_idx on public.order_items (order_id);
create index order_items_menu_item_id_idx on public.order_items (menu_item_id);

-- ---------------------------------------------------------------------------
-- order_status_history
-- ---------------------------------------------------------------------------

create table public.order_status_history (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  status public.order_status not null,
  changed_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create index order_status_history_order_id_idx on public.order_status_history (order_id);

-- ---------------------------------------------------------------------------
-- updated_at maintenance trigger (generic, reused across tables)
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create trigger set_menu_items_updated_at
  before update on public.menu_items
  for each row execute function public.set_updated_at();

create trigger set_orders_updated_at
  before update on public.orders
  for each row execute function public.set_updated_at();

create trigger set_restaurant_settings_updated_at
  before update on public.restaurant_settings
  for each row execute function public.set_updated_at();
