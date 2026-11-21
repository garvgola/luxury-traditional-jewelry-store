-- Run with: supabase test db
begin;
create extension if not exists pgtap with schema extensions;
select plan(42);

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

select has_table('public','checkout_payment_locks','checkout payment claims are stored server-side');
select ok((select relrowsecurity from pg_class where oid='public.checkout_payment_locks'::regclass),'checkout payment locks enforce RLS');
select ok(to_regprocedure('public.create_checkout_order(uuid,uuid,text)') is not null,'atomic checkout order function exists');
select ok(not has_function_privilege('anon','public.create_checkout_order(uuid,uuid,text)','execute'),'anonymous users cannot create orders');
select ok(not has_function_privilege('authenticated','public.create_checkout_order(uuid,uuid,text)','execute'),'customers cannot bypass trusted checkout');
select ok(to_regprocedure('public.claim_checkout_payment(uuid,uuid)') is not null,'payment creation claim function exists');
select ok(not has_function_privilege('anon','public.claim_checkout_payment(uuid,uuid)','execute'),'anonymous users cannot claim payment sessions');
select ok(to_regprocedure('public.mark_razorpay_payment_captured(text,text,bigint,text,text)') is not null,'verified payment reconciliation function exists');
select ok(not has_function_privilege('authenticated','public.mark_razorpay_payment_captured(text,text,bigint,text,text)','execute'),'customers cannot mark orders paid');
select has_column('public','product_variants','hsn_code','product variants store HSN classification');
select has_column('public','product_variants','gst_rate_bps','product variants store GST rate in basis points');
select has_column('public','product_variants','price_includes_tax','product variants store tax inclusion treatment');
select has_column('public','orders','checkout_idempotency_key','orders store checkout idempotency key');
select has_column('public','orders','tax_breakdown','orders store tax calculation snapshot');
select has_column('public','order_items','hsn_code_snapshot','order items snapshot HSN classification');
select ok(to_regprocedure('public.mark_razorpay_payment_failed(text,text,bigint,text,text)') is not null,'failed payment reconciliation function exists');
select ok(not has_function_privilege('authenticated','public.mark_razorpay_payment_failed(text,text,bigint,text,text)','execute'),'customers cannot alter payment failure state');
select has_column('public','orders','shipping_carrier','orders store carrier details');
select has_column('public','orders','tracking_number','orders store shipment tracking numbers');
select ok(to_regprocedure('public.admin_update_order_fulfilment(uuid,public.order_status,text,text)') is not null,'audited admin fulfilment transition function exists');
select ok(not has_function_privilege('anon','public.admin_update_order_fulfilment(uuid,public.order_status,text,text)','execute'),'anonymous users cannot update fulfilment');
select ok(to_regprocedure('public.admin_add_product_variant(uuid,text,text,bigint,public.product_availability_status,text,integer,boolean)') is not null,'admin product variant creation function exists');
select ok(not has_function_privilege('anon','public.admin_add_product_variant(uuid,text,text,bigint,public.product_availability_status,text,integer,boolean)','execute'),'anonymous users cannot create product variants');
select * from finish();
rollback;
