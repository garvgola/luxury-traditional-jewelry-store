-- NAMO NAMO jewels: release-one commerce foundation.
-- Apply with: supabase db push (or supabase migration up) against a reviewed non-production project.
-- No inventory quantities/reservations, guest checkout, returns, or refunds are implemented.

begin;

create extension if not exists pgcrypto;

create type public.app_role as enum ('customer', 'admin');
create type public.product_availability_status as enum ('available_to_order', 'made_to_order', 'temporarily_unavailable');
create type public.order_status as enum ('pending_payment', 'paid', 'processing', 'shipped', 'delivered', 'cancelled');
create type public.payment_status as enum ('created', 'authorized', 'captured', 'failed', 'cancelled');

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.user_roles (
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null default 'customer',
  created_at timestamptz not null default now(),
  primary key (user_id, role)
);

create or replace function public.has_role(required_role public.app_role)
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = (select auth.uid()) and role = required_role
  );
$$;

revoke all on function public.has_role(public.app_role) from public;
grant execute on function public.has_role(public.app_role) to anon, authenticated;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, nullif(new.raw_user_meta_data ->> 'full_name', ''))
  on conflict (id) do nothing;
  insert into public.user_roles (user_id, role)
  values (new.id, 'customer')
  on conflict do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create table public.customer_addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  recipient_name text not null,
  phone text not null,
  address_line_1 text not null,
  address_line_2 text,
  locality text,
  city text not null,
  state text not null,
  postal_code text not null,
  country_code char(2) not null default 'IN',
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint customer_addresses_postal_code_nonempty check (length(trim(postal_code)) > 0)
);
create index customer_addresses_user_idx on public.customer_addresses(user_id);
create unique index customer_addresses_one_default_idx on public.customer_addresses(user_id) where is_default;

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  image_path text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.collections (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  banner_path text,
  is_active boolean not null default true,
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint collections_valid_window check (ends_at is null or starts_at is null or ends_at > starts_at)
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.categories(id) on delete set null,
  name text not null,
  slug text not null unique,
  description text,
  status text not null default 'draft' check (status in ('draft', 'active', 'archived')),
  is_featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index products_active_category_idx on public.products(category_id, created_at desc) where status = 'active';

create table public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  sku text unique,
  variant_label text not null default 'Default',
  attributes jsonb not null default '{}'::jsonb,
  price_paise bigint not null check (price_paise >= 0),
  compare_at_price_paise bigint check (compare_at_price_paise is null or compare_at_price_paise >= 0),
  currency char(3) not null default 'INR' check (currency = 'INR'),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index product_variants_product_idx on public.product_variants(product_id) where is_active;

create table public.product_availability (
  variant_id uuid primary key references public.product_variants(id) on delete cascade,
  availability public.product_availability_status not null default 'available_to_order',
  estimated_lead_days_min integer check (estimated_lead_days_min is null or estimated_lead_days_min >= 0),
  estimated_lead_days_max integer check (estimated_lead_days_max is null or estimated_lead_days_max >= 0),
  customer_note text,
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now(),
  constraint availability_lead_window check (
    estimated_lead_days_max is null or estimated_lead_days_min is null
    or estimated_lead_days_max >= estimated_lead_days_min
  )
);

create table public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  variant_id uuid references public.product_variants(id) on delete cascade,
  storage_path text not null,
  alt_text text not null default '',
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
create index product_images_product_idx on public.product_images(product_id, sort_order);

create table public.collection_products (
  collection_id uuid not null references public.collections(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  sort_order integer not null default 0,
  primary key (collection_id, product_id)
);

create table public.shipping_zones (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  country_code char(2) not null default 'IN',
  postal_code_prefixes text[] not null default '{}',
  is_active boolean not null default true,
  estimated_days_min integer not null default 5 check (estimated_days_min >= 0),
  estimated_days_max integer not null default 10 check (estimated_days_max >= estimated_days_min),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.shipping_rates (
  id uuid primary key default gen_random_uuid(),
  zone_id uuid not null references public.shipping_zones(id) on delete cascade,
  fee_paise bigint not null check (fee_paise >= 0),
  min_order_subtotal_paise bigint not null default 0 check (min_order_subtotal_paise >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (zone_id, min_order_subtotal_paise)
);
create index shipping_rates_active_zone_idx on public.shipping_rates(zone_id, min_order_subtotal_paise desc) where is_active;

-- Only server-side checkout should call this function. It resolves the most specific
-- configured prefix and the highest qualifying subtotal threshold.
create or replace function public.quote_shipping(
  p_country_code text,
  p_postal_code text,
  p_subtotal_paise bigint
)
returns table (zone_id uuid, shipping_fee_paise bigint, estimated_days_min integer, estimated_days_max integer)
language sql stable security definer
set search_path = ''
as $$
  select z.id, r.fee_paise, z.estimated_days_min, z.estimated_days_max
  from public.shipping_zones z
  join public.shipping_rates r on r.zone_id = z.id and r.is_active
  where z.is_active
    and z.country_code = upper(p_country_code)
    and (cardinality(z.postal_code_prefixes) = 0 or exists (
      select 1 from unnest(z.postal_code_prefixes) as prefixes(prefix)
      where p_postal_code like prefix || '%'
    ))
    and r.min_order_subtotal_paise <= p_subtotal_paise
  order by
    (select coalesce(max(length(prefix)), 0)
     from unnest(z.postal_code_prefixes) prefix
     where p_postal_code like prefix || '%') desc,
    r.min_order_subtotal_paise desc
  limit 1;
$$;
revoke all on function public.quote_shipping(text, text, bigint) from public, anon, authenticated;
grant execute on function public.quote_shipping(text, text, bigint) to service_role;

create table public.carts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.cart_items (
  id uuid primary key default gen_random_uuid(),
  cart_id uuid not null references public.carts(id) on delete cascade,
  variant_id uuid not null references public.product_variants(id) on delete restrict,
  quantity integer not null check (quantity between 1 and 20),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (cart_id, variant_id)
);

create table public.wishlists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table public.wishlist_items (
  wishlist_id uuid not null references public.wishlists(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (wishlist_id, product_id)
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  user_id uuid not null references auth.users(id) on delete restrict,
  status public.order_status not null default 'pending_payment',
  currency char(3) not null default 'INR' check (currency = 'INR'),
  subtotal_paise bigint not null check (subtotal_paise >= 0),
  discount_paise bigint not null default 0 check (discount_paise >= 0),
  tax_paise bigint not null default 0 check (tax_paise >= 0),
  shipping_paise bigint not null check (shipping_paise >= 0),
  total_paise bigint not null check (total_paise >= 0),
  shipping_zone_id uuid references public.shipping_zones(id) on delete set null,
  shipping_address_snapshot jsonb not null,
  delivery_estimate_min date,
  delivery_estimate_max date,
  placed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint orders_total_matches_snapshot check (
    total_paise = subtotal_paise - discount_paise + tax_paise + shipping_paise
  ),
  constraint orders_delivery_window check (
    delivery_estimate_max is null or delivery_estimate_min is null
    or delivery_estimate_max >= delivery_estimate_min
  )
);
create index orders_customer_recent_idx on public.orders(user_id, created_at desc);
create index orders_status_recent_idx on public.orders(status, created_at desc);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  variant_id uuid references public.product_variants(id) on delete set null,
  sku_snapshot text,
  product_name_snapshot text not null,
  variant_label_snapshot text,
  unit_price_paise bigint not null check (unit_price_paise >= 0),
  quantity integer not null check (quantity between 1 and 20),
  line_total_paise bigint not null check (line_total_paise = unit_price_paise * quantity),
  created_at timestamptz not null default now()
);
create index order_items_order_idx on public.order_items(order_id);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete restrict,
  provider text not null check (provider = 'razorpay'),
  provider_order_id text unique,
  provider_payment_id text unique,
  amount_paise bigint not null check (amount_paise >= 0),
  currency char(3) not null default 'INR' check (currency = 'INR'),
  status public.payment_status not null default 'created',
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index payments_order_idx on public.payments(order_id);

create table public.payment_events (
  id uuid primary key default gen_random_uuid(),
  payment_id uuid references public.payments(id) on delete set null,
  provider_event_id text not null unique,
  event_type text not null,
  payload_redacted jsonb not null default '{}'::jsonb,
  signature_verified boolean not null default false,
  received_at timestamptz not null default now(),
  processed_at timestamptz
);

create table public.order_status_history (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  from_status public.order_status,
  to_status public.order_status not null,
  actor_id uuid references auth.users(id) on delete set null,
  note text,
  created_at timestamptz not null default now()
);
create index order_status_history_order_idx on public.order_status_history(order_id, created_at);

create table public.admin_audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity_table text not null,
  entity_id uuid,
  before_data jsonb,
  after_data jsonb,
  created_at timestamptz not null default now()
);
create index admin_audit_logs_recent_idx on public.admin_audit_logs(created_at desc);

-- Updated-at triggers.
do $$
declare t text;
begin
  foreach t in array array['profiles','customer_addresses','categories','collections','products',
    'product_variants','shipping_zones','shipping_rates','carts','cart_items','orders','payments']
  loop
    execute format('create trigger set_updated_at before update on public.%I for each row execute procedure public.set_updated_at()', t);
  end loop;
end $$;

-- RLS is enabled everywhere; service_role is reserved for trusted server code.
do $$
declare t text;
begin
  foreach t in array array['profiles','user_roles','customer_addresses','categories','collections',
    'products','product_variants','product_availability','product_images','collection_products',
    'shipping_zones','shipping_rates','carts','cart_items','wishlists','wishlist_items',
    'orders','order_items','payments','payment_events','order_status_history','admin_audit_logs']
  loop
    execute format('alter table public.%I enable row level security', t);
  end loop;
end $$;

-- Customer-owned records.
create policy "profiles_select_own_or_admin" on public.profiles for select to authenticated
  using (id = (select auth.uid()) or (select public.has_role('admin')));
create policy "profiles_update_own_or_admin" on public.profiles for update to authenticated
  using (id = (select auth.uid()) or (select public.has_role('admin')))
  with check (id = (select auth.uid()) or (select public.has_role('admin')));
create policy "addresses_manage_own_or_admin" on public.customer_addresses for all to authenticated
  using (user_id = (select auth.uid()) or (select public.has_role('admin')))
  with check (user_id = (select auth.uid()) or (select public.has_role('admin')));
create policy "roles_read_own_or_admin" on public.user_roles for select to authenticated
  using (user_id = (select auth.uid()) or (select public.has_role('admin')));
-- Intentionally no client insert/update/delete policy for user_roles.
create policy "public_read_active_categories" on public.categories for select to anon, authenticated using (is_active or (select public.has_role('admin')));
create policy "admin_manage_categories" on public.categories for all to authenticated
  using ((select public.has_role('admin'))) with check ((select public.has_role('admin')));
create policy "public_read_active_collections" on public.collections for select to anon, authenticated using (
  (is_active and (starts_at is null or starts_at <= now()) and (ends_at is null or ends_at > now()))
  or (select public.has_role('admin'))
);
create policy "admin_manage_collections" on public.collections for all to authenticated
  using ((select public.has_role('admin'))) with check ((select public.has_role('admin')));
create policy "public_read_active_products" on public.products for select to anon, authenticated
  using ((status = 'active') or (select public.has_role('admin')));
create policy "admin_manage_products" on public.products for all to authenticated
  using ((select public.has_role('admin'))) with check ((select public.has_role('admin')));
create policy "public_read_active_variants" on public.product_variants for select to anon, authenticated
  using ((is_active and exists (select 1 from public.products p where p.id = product_id and p.status = 'active'))
    or (select public.has_role('admin')));
create policy "admin_manage_variants" on public.product_variants for all to authenticated
  using ((select public.has_role('admin'))) with check ((select public.has_role('admin')));
create policy "public_read_availability" on public.product_availability for select to anon, authenticated
  using (exists (select 1 from public.product_variants v join public.products p on p.id=v.product_id
    where v.id=variant_id and v.is_active and p.status='active') or (select public.has_role('admin')));
create policy "admin_manage_availability" on public.product_availability for all to authenticated
  using ((select public.has_role('admin'))) with check ((select public.has_role('admin')));
create policy "public_read_product_images" on public.product_images for select to anon, authenticated
  using (exists (select 1 from public.products p where p.id=product_id and p.status='active')
    or (select public.has_role('admin')));
create policy "admin_manage_product_images" on public.product_images for all to authenticated
  using ((select public.has_role('admin'))) with check ((select public.has_role('admin')));
create policy "public_read_collection_products" on public.collection_products for select to anon, authenticated
  using (exists (select 1 from public.collections c where c.id=collection_id and c.is_active)
    or (select public.has_role('admin')));
create policy "admin_manage_collection_products" on public.collection_products for all to authenticated
  using ((select public.has_role('admin'))) with check ((select public.has_role('admin')));
create policy "admin_manage_shipping_zones" on public.shipping_zones for all to authenticated
  using ((select public.has_role('admin'))) with check ((select public.has_role('admin')));
create policy "admin_manage_shipping_rates" on public.shipping_rates for all to authenticated
  using ((select public.has_role('admin'))) with check ((select public.has_role('admin')));
create policy "customers_manage_own_cart" on public.carts for all to authenticated
  using (user_id = (select auth.uid()) or (select public.has_role('admin')))
  with check (user_id = (select auth.uid()) or (select public.has_role('admin')));
create policy "customers_manage_own_cart_items" on public.cart_items for all to authenticated
  using (exists (select 1 from public.carts c where c.id=cart_id and c.user_id=(select auth.uid()))
    or (select public.has_role('admin')))
  with check (exists (select 1 from public.carts c where c.id=cart_id and c.user_id=(select auth.uid()))
    or (select public.has_role('admin')));
create policy "customers_manage_own_wishlist" on public.wishlists for all to authenticated
  using (user_id = (select auth.uid()) or (select public.has_role('admin')))
  with check (user_id = (select auth.uid()) or (select public.has_role('admin')));
create policy "customers_manage_own_wishlist_items" on public.wishlist_items for all to authenticated
  using (exists (select 1 from public.wishlists w where w.id=wishlist_id and w.user_id=(select auth.uid()))
    or (select public.has_role('admin')))
  with check (exists (select 1 from public.wishlists w where w.id=wishlist_id and w.user_id=(select auth.uid()))
    or (select public.has_role('admin')));
create policy "customers_read_own_orders" on public.orders for select to authenticated
  using (user_id = (select auth.uid()) or (select public.has_role('admin')));
create policy "customers_read_own_order_items" on public.order_items for select to authenticated
  using (exists (select 1 from public.orders o where o.id=order_id and o.user_id=(select auth.uid()))
    or (select public.has_role('admin')));
create policy "customers_read_own_payments" on public.payments for select to authenticated
  using (exists (select 1 from public.orders o where o.id=order_id and o.user_id=(select auth.uid()))
    or (select public.has_role('admin')));
create policy "admins_read_payment_events" on public.payment_events for select to authenticated
  using ((select public.has_role('admin')));
create policy "admins_read_order_history" on public.order_status_history for select to authenticated
  using (exists (select 1 from public.orders o where o.id=order_id and o.user_id=(select auth.uid()))
    or (select public.has_role('admin')));
create policy "admins_read_audit_logs" on public.admin_audit_logs for select to authenticated
  using ((select public.has_role('admin')));

-- No customer-facing write policies exist for orders, order_items, payments, payment_events,
-- order_status_history, or admin_audit_logs. Trusted server/service-role operations own them.

commit;
