-- Run with: supabase test db
begin;
create extension if not exists pgtap with schema extensions;
select plan(19);

select has_table('public', 'profiles', 'profiles table exists');
select has_table('public', 'customer_addresses', 'customer addresses table exists');
select has_table('public', 'products', 'products table exists');
select has_table('public', 'product_variants', 'product variants table exists');
select has_table('public', 'product_availability', 'manual availability table exists');
select has_table('public', 'shipping_zones', 'shipping zones table exists');
select has_table('public', 'shipping_rates', 'shipping rates table exists');
select has_table('public', 'orders', 'orders table exists');
select has_table('public', 'order_items', 'order items table exists');
select has_table('public', 'payments', 'payments table exists');
select has_table('public', 'payment_events', 'payment event idempotency table exists');
select has_table('public', 'admin_audit_logs', 'admin audit log table exists');

select ok((select relrowsecurity from pg_class where oid='public.customer_addresses'::regclass), 'customer addresses enforce RLS');
select ok((select relrowsecurity from pg_class where oid='public.orders'::regclass), 'orders enforce RLS');
select ok((select relrowsecurity from pg_class where oid='public.payments'::regclass), 'payments enforce RLS');
select ok(not exists (
  select 1 from pg_policies where schemaname='public' and tablename='user_roles'
    and cmd in ('INSERT','UPDATE','DELETE','ALL')
), 'clients cannot mutate role assignments through RLS');
select ok(not exists (
  select 1 from information_schema.tables where table_schema='public'
    and table_name in ('inventory','inventory_movements')
), 'release one does not introduce quantity inventory tables');
select ok(to_regprocedure('public.quote_shipping(text,text,bigint)') is not null,
  'server-side location-based shipping quote function exists');
select ok(not has_function_privilege('anon','public.quote_shipping(text,text,bigint)','execute'),
  'anonymous users cannot execute privileged shipping quote function');

select * from finish();
rollback;
