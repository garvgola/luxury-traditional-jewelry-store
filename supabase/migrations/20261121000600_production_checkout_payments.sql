-- Production checkout and Razorpay payment foundation.
-- Tax is deliberately configured per variant: do not infer a GST rate or price-inclusion policy.
begin;

alter table public.product_variants
  add column if not exists hsn_code text,
  add column if not exists gst_rate_bps integer,
  add column if not exists price_includes_tax boolean;

alter table public.product_variants
  drop constraint if exists product_variants_gst_rate_bps_check;
alter table public.product_variants
  add constraint product_variants_gst_rate_bps_check
  check (gst_rate_bps is null or gst_rate_bps between 0 and 2800);
alter table public.product_variants
  drop constraint if exists product_variants_hsn_code_check;
alter table public.product_variants
  add constraint product_variants_hsn_code_check
  check (hsn_code is null or hsn_code ~ '^[0-9]{4,8}$');

alter table public.orders
  add column if not exists checkout_idempotency_key text,
  add column if not exists tax_added_paise bigint not null default 0,
  add column if not exists tax_breakdown jsonb not null default '[]'::jsonb;

alter table public.orders drop constraint if exists orders_total_matches_snapshot;
alter table public.orders
  add constraint orders_total_matches_snapshot
  check (total_paise = subtotal_paise - discount_paise + tax_added_paise + shipping_paise);
create unique index if not exists orders_user_checkout_idempotency_idx
  on public.orders(user_id,checkout_idempotency_key)
  where checkout_idempotency_key is not null;

alter table public.order_items
  add column if not exists hsn_code_snapshot text,
  add column if not exists gst_rate_bps_snapshot integer,
  add column if not exists price_includes_tax_snapshot boolean,
  add column if not exists tax_paise bigint not null default 0;

-- Replace product creation with mandatory tax classification for new sellable variants.
drop function if exists public.admin_create_product(text,text,text,uuid,bigint,text,text,public.product_availability_status);
create function public.admin_create_product(
  p_name text,p_slug text,p_description text,p_category_id uuid,p_price_paise bigint,
  p_sku text,p_variant_label text,p_availability public.product_availability_status,
  p_hsn_code text,p_gst_rate_bps integer,p_price_includes_tax boolean
)
returns uuid language plpgsql security invoker set search_path = ''
as $
declare new_product_id uuid; new_variant_id uuid;
begin
  if not public.has_role('admin') then raise exception 'Administrator access required'; end if;
  if p_price_paise<=0 then raise exception 'Price must be greater than zero'; end if;
  if p_hsn_code !~ '^[0-9]{4,8}
  order_id uuid primary key references public.orders(id) on delete cascade,
  claim_token uuid not null,
  locked_until timestamptz not null,
  created_at timestamptz not null default now()
);
alter table public.checkout_payment_locks enable row level security;

create or replace function public.create_checkout_order(
  p_user_id uuid,
  p_address_id uuid,
  p_idempotency_key text
)
returns table (
  order_id uuid,
  order_number text,
  subtotal_paise bigint,
  tax_paise bigint,
  tax_added_paise bigint,
  shipping_paise bigint,
  total_paise bigint,
  currency text,
  estimated_days_min integer,
  estimated_days_max integer,
  provider_order_id text
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_cart_id uuid;
  v_address public.customer_addresses%rowtype;
  v_existing public.orders%rowtype;
  v_shipping record;
  v_item record;
  v_order_id uuid;
  v_order_number text;
  v_subtotal bigint := 0;
  v_tax bigint := 0;
  v_tax_added bigint := 0;
  v_shipping_fee bigint;
  v_total bigint;
  v_tax_breakdown jsonb := '[]'::jsonb;
  v_items jsonb := '[]'::jsonb;
  v_line bigint;
  v_line_tax bigint;
  v_order_created_at timestamptz := now();
begin
  if coalesce(auth.role(),'') <> 'service_role' then
    raise exception 'Trusted server access required';
  end if;
  if p_user_id is null or p_address_id is null or p_idempotency_key !~ '^[A-Za-z0-9_-]{16,80}$' then
    raise exception 'Invalid checkout request';
  end if;

  select * into v_existing
  from public.orders o
  where o.user_id=p_user_id and o.checkout_idempotency_key=p_idempotency_key;
  if found then
    return query
      select v_existing.id,v_existing.order_number,v_existing.subtotal_paise,v_existing.tax_paise,
        v_existing.tax_added_paise,v_existing.shipping_paise,v_existing.total_paise,v_existing.currency::text,
        coalesce((v_existing.delivery_estimate_min-current_date),0),
        coalesce((v_existing.delivery_estimate_max-current_date),0),
        p.provider_order_id
      from public.payments p where p.order_id=v_existing.id limit 1;
    return;
  end if;

  select * into v_address from public.customer_addresses a
  where a.id=p_address_id and a.user_id=p_user_id;
  if not found then raise exception 'Delivery address not found'; end if;

  select c.id into v_cart_id from public.carts c where c.user_id=p_user_id for update;
  if v_cart_id is null then raise exception 'Your bag is empty'; end if;

  for v_item in
    select ci.quantity,v.id as variant_id,v.product_id,v.sku,v.variant_label,v.price_paise,
      v.hsn_code,v.gst_rate_bps,v.price_includes_tax,p.name as product_name,p.status as product_status,
      coalesce(pa.availability,'available_to_order'::public.product_availability_status)::text as availability
    from public.cart_items ci
    join public.product_variants v on v.id=ci.variant_id
    join public.products p on p.id=v.product_id
    left join public.product_availability pa on pa.variant_id=v.id
    where ci.cart_id=v_cart_id
    order by ci.created_at
    for update of ci,v
  loop
    if v_item.product_status <> 'active' then raise exception 'A product in your bag is no longer published'; end if;
    if not exists(select 1 from public.product_variants v where v.id=v_item.variant_id and v.is_active) then
      raise exception 'A product in your bag is no longer available';
    end if;
    if v_item.availability='temporarily_unavailable' then raise exception 'A product in your bag is temporarily unavailable'; end if;
    if v_item.hsn_code is null or v_item.gst_rate_bps is null or v_item.price_includes_tax is null then
      raise exception 'Tax configuration is incomplete for product: %',v_item.product_name;
    end if;

    v_line := v_item.price_paise * v_item.quantity;
    if v_item.price_includes_tax then
      v_line_tax := round((v_line::numeric*v_item.gst_rate_bps)/(10000+v_item.gst_rate_bps))::bigint;
    else
      v_line_tax := round((v_line::numeric*v_item.gst_rate_bps)/10000)::bigint;
      v_tax_added := v_tax_added + v_line_tax;
    end if;
    v_subtotal := v_subtotal + v_line;
    v_tax := v_tax + v_line_tax;
    v_tax_breakdown := v_tax_breakdown || jsonb_build_array(jsonb_build_object(
      'product_name',v_item.product_name,'hsn_code',v_item.hsn_code,
      'gst_rate_bps',v_item.gst_rate_bps,'tax_paise',v_line_tax,
      'price_includes_tax',v_item.price_includes_tax
    ));
    v_items := v_items || jsonb_build_array(jsonb_build_object(
      'product_id',v_item.product_id,'variant_id',v_item.variant_id,'sku_snapshot',v_item.sku,
      'product_name_snapshot',v_item.product_name,'variant_label_snapshot',v_item.variant_label,
      'unit_price_paise',v_item.price_paise,'quantity',v_item.quantity,'line_total_paise',v_line,
      'hsn_code_snapshot',v_item.hsn_code,'gst_rate_bps_snapshot',v_item.gst_rate_bps,
      'price_includes_tax_snapshot',v_item.price_includes_tax,'tax_paise',v_line_tax
    ));
  end loop;
  if v_subtotal=0 and jsonb_array_length(v_items)=0 then raise exception 'Your bag is empty'; end if;

  select * into v_shipping from public.quote_shipping(v_address.country_code::text,v_address.postal_code,v_subtotal);
  if not found then raise exception 'Shipping is not configured for this PIN code'; end if;
  v_shipping_fee := v_shipping.shipping_fee_paise;
  v_total := v_subtotal + v_tax_added + v_shipping_fee;
  if v_total<=0 then raise exception 'Invalid order total'; end if;

  v_order_number := 'NNJ-' || to_char(v_order_created_at,'YYYYMMDD') || '-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,8));
  insert into public.orders(
    order_number,user_id,status,currency,subtotal_paise,discount_paise,tax_paise,tax_added_paise,
    tax_breakdown,shipping_paise,total_paise,shipping_zone_id,shipping_address_snapshot,
    delivery_estimate_min,delivery_estimate_max,placed_at,checkout_idempotency_key
  ) values (
    v_order_number,p_user_id,'pending_payment','INR',v_subtotal,0,v_tax,v_tax_added,
    v_tax_breakdown,v_shipping_fee,v_total,v_shipping.zone_id,to_jsonb(v_address),
    current_date+v_shipping.estimated_days_min,current_date+v_shipping.estimated_days_max,
    v_order_created_at,p_idempotency_key
  ) returning id into v_order_id;

  insert into public.order_items(
    order_id,product_id,variant_id,sku_snapshot,product_name_snapshot,variant_label_snapshot,
    unit_price_paise,quantity,line_total_paise,hsn_code_snapshot,gst_rate_bps_snapshot,
    price_includes_tax_snapshot,tax_paise
  )
  select v_order_id,x.product_id,x.variant_id,x.sku_snapshot,x.product_name_snapshot,x.variant_label_snapshot,
    x.unit_price_paise,x.quantity,x.line_total_paise,x.hsn_code_snapshot,x.gst_rate_bps_snapshot,
    x.price_includes_tax_snapshot,x.tax_paise
  from jsonb_to_recordset(v_items) as x(
    product_id uuid,variant_id uuid,sku_snapshot text,product_name_snapshot text,
    variant_label_snapshot text,unit_price_paise bigint,quantity integer,line_total_paise bigint,
    hsn_code_snapshot text,gst_rate_bps_snapshot integer,price_includes_tax_snapshot boolean,tax_paise bigint
  );

  insert into public.payments(order_id,provider,amount_paise,currency,status)
  values(v_order_id,'razorpay',v_total,'INR','created');

  return query select v_order_id,v_order_number,v_subtotal,v_tax,v_tax_added,v_shipping_fee,v_total,
    'INR'::text,v_shipping.estimated_days_min,v_shipping.estimated_days_max,null::text;
end;
$$;

revoke all on function public.create_checkout_order(uuid,uuid,text) from public,anon,authenticated;
grant execute on function public.create_checkout_order(uuid,uuid,text) to service_role;

create or replace function public.claim_checkout_payment(
  p_order_id uuid,
  p_claim_token uuid
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  if coalesce(auth.role(),'') <> 'service_role' then raise exception 'Trusted server access required'; end if;
  insert into public.checkout_payment_locks(order_id,claim_token,locked_until)
  values(p_order_id,p_claim_token,now()+interval '90 seconds')
  on conflict(order_id) do update
    set claim_token=excluded.claim_token,locked_until=excluded.locked_until
    where public.checkout_payment_locks.locked_until < now();
  return found;
end;
$$;
revoke all on function public.claim_checkout_payment(uuid,uuid) from public,anon,authenticated;
grant execute on function public.claim_checkout_payment(uuid,uuid) to service_role;

create or replace function public.release_checkout_payment_claim(p_order_id uuid,p_claim_token uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if coalesce(auth.role(),'') <> 'service_role' then raise exception 'Trusted server access required'; end if;
  delete from public.checkout_payment_locks where order_id=p_order_id and claim_token=p_claim_token;
end;
$$;
revoke all on function public.release_checkout_payment_claim(uuid,uuid) from public,anon,authenticated;
grant execute on function public.release_checkout_payment_claim(uuid,uuid) to service_role;

create or replace function public.mark_razorpay_payment_captured(
  p_provider_order_id text,
  p_provider_payment_id text,
  p_amount_paise bigint,
  p_event_id text,
  p_event_type text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_payment public.payments%rowtype;
  v_order public.orders%rowtype;
  v_duplicate boolean := false;
begin
  if coalesce(auth.role(),'') <> 'service_role' then raise exception 'Trusted server access required'; end if;
  if p_event_id is null or p_event_id='' then raise exception 'Missing payment event id'; end if;

  insert into public.payment_events(provider_event_id,event_type,payload_redacted,signature_verified,processed_at)
  values(p_event_id,p_event_type,jsonb_build_object('provider_order_id',p_provider_order_id,
    'provider_payment_id',p_provider_payment_id,'amount_paise',p_amount_paise),true,now())
  on conflict(provider_event_id) do nothing;
  if not found then
    select p.order_id into v_order.id from public.payments p where p.provider_order_id=p_provider_order_id;
    return v_order.id;
  end if;

  select * into v_payment from public.payments p
  where p.provider_order_id=p_provider_order_id for update;
  if not found then raise exception 'Payment order not found'; end if;
  if v_payment.amount_paise<>p_amount_paise or v_payment.currency<>'INR' then
    raise exception 'Payment amount or currency mismatch';
  end if;
  if v_payment.status='captured' then
    update public.payments set provider_payment_id=coalesce(provider_payment_id,p_provider_payment_id),
      verified_at=coalesce(verified_at,now()) where id=v_payment.id;
    return v_payment.order_id;
  end if;
  select * into v_order from public.orders where id=v_payment.order_id for update;
  if v_order.status not in ('pending_payment','paid') then raise exception 'Order is not payable'; end if;

  update public.payments set status='captured',provider_payment_id=p_provider_payment_id,verified_at=now()
  where id=v_payment.id;
  if v_order.status='pending_payment' then
    update public.orders set status='paid' where id=v_order.id;
    insert into public.order_status_history(order_id,from_status,to_status,actor_id,note)
    values(v_order.id,'pending_payment','paid',null,'Payment captured and verified');
    update public.payment_events set payment_id=v_payment.id where provider_event_id=p_event_id;
    update public.carts c set updated_at=now() where c.user_id=v_order.user_id;
    update public.cart_items ci set quantity=ci.quantity-oi.quantity,updated_at=now()
    from public.order_items oi,public.carts c
    where oi.order_id=v_order.id and c.user_id=v_order.user_id
      and ci.cart_id=c.id and ci.variant_id=oi.variant_id and ci.quantity>oi.quantity;
    delete from public.cart_items ci using public.order_items oi,public.carts c
    where oi.order_id=v_order.id and c.user_id=v_order.user_id
      and ci.cart_id=c.id and ci.variant_id=oi.variant_id and ci.quantity<=oi.quantity;
  end if;
  update public.payment_events set payment_id=v_payment.id where provider_event_id=p_event_id;
  return v_payment.order_id;
end;
$$;
revoke all on function public.mark_razorpay_payment_captured(text,text,bigint,text,text) from public,anon,authenticated;
grant execute on function public.mark_razorpay_payment_captured(text,text,bigint,text,text) to service_role;

commit;
 or p_gst_rate_bps not between 0 and 2800 or p_price_includes_tax is null then
    raise exception 'Valid HSN, GST rate and tax-inclusive setting are required';
  end if;
  insert into public.products(category_id,name,slug,description,status)
  values(p_category_id,trim(p_name),trim(p_slug),nullif(trim(p_description),''),'active')
  returning id into new_product_id;
  insert into public.product_variants(
    product_id,sku,variant_label,price_paise,hsn_code,gst_rate_bps,price_includes_tax
  ) values(
    new_product_id,nullif(trim(p_sku),''),coalesce(nullif(trim(p_variant_label),''),'Default'),
    p_price_paise,trim(p_hsn_code),p_gst_rate_bps,p_price_includes_tax
  ) returning id into new_variant_id;
  insert into public.product_availability(variant_id,availability,updated_by)
  values(new_variant_id,p_availability,(select auth.uid()));
  return new_product_id;
end;
$;
revoke all on function public.admin_create_product(text,text,text,uuid,bigint,text,text,public.product_availability_status,text,integer,boolean) from public;
grant execute on function public.admin_create_product(text,text,text,uuid,bigint,text,text,public.product_availability_status,text,integer,boolean) to authenticated;

create table if not exists public.checkout_payment_locks (
  order_id uuid primary key references public.orders(id) on delete cascade,
  claim_token uuid not null,
  locked_until timestamptz not null,
  created_at timestamptz not null default now()
);
alter table public.checkout_payment_locks enable row level security;

create or replace function public.create_checkout_order(
  p_user_id uuid,
  p_address_id uuid,
  p_idempotency_key text
)
returns table (
  order_id uuid,
  order_number text,
  subtotal_paise bigint,
  tax_paise bigint,
  tax_added_paise bigint,
  shipping_paise bigint,
  total_paise bigint,
  currency text,
  estimated_days_min integer,
  estimated_days_max integer,
  provider_order_id text
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_cart_id uuid;
  v_address public.customer_addresses%rowtype;
  v_existing public.orders%rowtype;
  v_shipping record;
  v_item record;
  v_order_id uuid;
  v_order_number text;
  v_subtotal bigint := 0;
  v_tax bigint := 0;
  v_tax_added bigint := 0;
  v_shipping_fee bigint;
  v_total bigint;
  v_tax_breakdown jsonb := '[]'::jsonb;
  v_items jsonb := '[]'::jsonb;
  v_line bigint;
  v_line_tax bigint;
  v_order_created_at timestamptz := now();
begin
  if coalesce(auth.role(),'') <> 'service_role' then
    raise exception 'Trusted server access required';
  end if;
  if p_user_id is null or p_address_id is null or p_idempotency_key !~ '^[A-Za-z0-9_-]{16,80}$' then
    raise exception 'Invalid checkout request';
  end if;

  select * into v_existing
  from public.orders o
  where o.user_id=p_user_id and o.checkout_idempotency_key=p_idempotency_key;
  if found then
    return query
      select v_existing.id,v_existing.order_number,v_existing.subtotal_paise,v_existing.tax_paise,
        v_existing.tax_added_paise,v_existing.shipping_paise,v_existing.total_paise,v_existing.currency::text,
        coalesce((v_existing.delivery_estimate_min-current_date),0),
        coalesce((v_existing.delivery_estimate_max-current_date),0),
        p.provider_order_id
      from public.payments p where p.order_id=v_existing.id limit 1;
    return;
  end if;

  select * into v_address from public.customer_addresses a
  where a.id=p_address_id and a.user_id=p_user_id;
  if not found then raise exception 'Delivery address not found'; end if;

  select c.id into v_cart_id from public.carts c where c.user_id=p_user_id for update;
  if v_cart_id is null then raise exception 'Your bag is empty'; end if;

  for v_item in
    select ci.quantity,v.id as variant_id,v.product_id,v.sku,v.variant_label,v.price_paise,
      v.hsn_code,v.gst_rate_bps,v.price_includes_tax,p.name as product_name,p.status as product_status,
      coalesce(pa.availability,'available_to_order'::public.product_availability_status)::text as availability
    from public.cart_items ci
    join public.product_variants v on v.id=ci.variant_id
    join public.products p on p.id=v.product_id
    left join public.product_availability pa on pa.variant_id=v.id
    where ci.cart_id=v_cart_id
    order by ci.created_at
    for update of ci,v
  loop
    if v_item.product_status <> 'active' then raise exception 'A product in your bag is no longer published'; end if;
    if not exists(select 1 from public.product_variants v where v.id=v_item.variant_id and v.is_active) then
      raise exception 'A product in your bag is no longer available';
    end if;
    if v_item.availability='temporarily_unavailable' then raise exception 'A product in your bag is temporarily unavailable'; end if;
    if v_item.hsn_code is null or v_item.gst_rate_bps is null or v_item.price_includes_tax is null then
      raise exception 'Tax configuration is incomplete for product: %',v_item.product_name;
    end if;

    v_line := v_item.price_paise * v_item.quantity;
    if v_item.price_includes_tax then
      v_line_tax := round((v_line::numeric*v_item.gst_rate_bps)/(10000+v_item.gst_rate_bps))::bigint;
    else
      v_line_tax := round((v_line::numeric*v_item.gst_rate_bps)/10000)::bigint;
      v_tax_added := v_tax_added + v_line_tax;
    end if;
    v_subtotal := v_subtotal + v_line;
    v_tax := v_tax + v_line_tax;
    v_tax_breakdown := v_tax_breakdown || jsonb_build_array(jsonb_build_object(
      'product_name',v_item.product_name,'hsn_code',v_item.hsn_code,
      'gst_rate_bps',v_item.gst_rate_bps,'tax_paise',v_line_tax,
      'price_includes_tax',v_item.price_includes_tax
    ));
    v_items := v_items || jsonb_build_array(jsonb_build_object(
      'product_id',v_item.product_id,'variant_id',v_item.variant_id,'sku_snapshot',v_item.sku,
      'product_name_snapshot',v_item.product_name,'variant_label_snapshot',v_item.variant_label,
      'unit_price_paise',v_item.price_paise,'quantity',v_item.quantity,'line_total_paise',v_line,
      'hsn_code_snapshot',v_item.hsn_code,'gst_rate_bps_snapshot',v_item.gst_rate_bps,
      'price_includes_tax_snapshot',v_item.price_includes_tax,'tax_paise',v_line_tax
    ));
  end loop;
  if v_subtotal=0 and jsonb_array_length(v_items)=0 then raise exception 'Your bag is empty'; end if;

  select * into v_shipping from public.quote_shipping(v_address.country_code::text,v_address.postal_code,v_subtotal);
  if not found then raise exception 'Shipping is not configured for this PIN code'; end if;
  v_shipping_fee := v_shipping.shipping_fee_paise;
  v_total := v_subtotal + v_tax_added + v_shipping_fee;
  if v_total<=0 then raise exception 'Invalid order total'; end if;

  v_order_number := 'NNJ-' || to_char(v_order_created_at,'YYYYMMDD') || '-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,8));
  insert into public.orders(
    order_number,user_id,status,currency,subtotal_paise,discount_paise,tax_paise,tax_added_paise,
    tax_breakdown,shipping_paise,total_paise,shipping_zone_id,shipping_address_snapshot,
    delivery_estimate_min,delivery_estimate_max,placed_at,checkout_idempotency_key
  ) values (
    v_order_number,p_user_id,'pending_payment','INR',v_subtotal,0,v_tax,v_tax_added,
    v_tax_breakdown,v_shipping_fee,v_total,v_shipping.zone_id,to_jsonb(v_address),
    current_date+v_shipping.estimated_days_min,current_date+v_shipping.estimated_days_max,
    v_order_created_at,p_idempotency_key
  ) returning id into v_order_id;

  insert into public.order_items(
    order_id,product_id,variant_id,sku_snapshot,product_name_snapshot,variant_label_snapshot,
    unit_price_paise,quantity,line_total_paise,hsn_code_snapshot,gst_rate_bps_snapshot,
    price_includes_tax_snapshot,tax_paise
  )
  select v_order_id,x.product_id,x.variant_id,x.sku_snapshot,x.product_name_snapshot,x.variant_label_snapshot,
    x.unit_price_paise,x.quantity,x.line_total_paise,x.hsn_code_snapshot,x.gst_rate_bps_snapshot,
    x.price_includes_tax_snapshot,x.tax_paise
  from jsonb_to_recordset(v_items) as x(
    product_id uuid,variant_id uuid,sku_snapshot text,product_name_snapshot text,
    variant_label_snapshot text,unit_price_paise bigint,quantity integer,line_total_paise bigint,
    hsn_code_snapshot text,gst_rate_bps_snapshot integer,price_includes_tax_snapshot boolean,tax_paise bigint
  );

  insert into public.payments(order_id,provider,amount_paise,currency,status)
  values(v_order_id,'razorpay',v_total,'INR','created');

  return query select v_order_id,v_order_number,v_subtotal,v_tax,v_tax_added,v_shipping_fee,v_total,
    'INR'::text,v_shipping.estimated_days_min,v_shipping.estimated_days_max,null::text;
end;
$$;

revoke all on function public.create_checkout_order(uuid,uuid,text) from public,anon,authenticated;
grant execute on function public.create_checkout_order(uuid,uuid,text) to service_role;

create or replace function public.claim_checkout_payment(
  p_order_id uuid,
  p_claim_token uuid
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  if coalesce(auth.role(),'') <> 'service_role' then raise exception 'Trusted server access required'; end if;
  insert into public.checkout_payment_locks(order_id,claim_token,locked_until)
  values(p_order_id,p_claim_token,now()+interval '90 seconds')
  on conflict(order_id) do update
    set claim_token=excluded.claim_token,locked_until=excluded.locked_until
    where public.checkout_payment_locks.locked_until < now();
  return found;
end;
$$;
revoke all on function public.claim_checkout_payment(uuid,uuid) from public,anon,authenticated;
grant execute on function public.claim_checkout_payment(uuid,uuid) to service_role;

create or replace function public.release_checkout_payment_claim(p_order_id uuid,p_claim_token uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if coalesce(auth.role(),'') <> 'service_role' then raise exception 'Trusted server access required'; end if;
  delete from public.checkout_payment_locks where order_id=p_order_id and claim_token=p_claim_token;
end;
$$;
revoke all on function public.release_checkout_payment_claim(uuid,uuid) from public,anon,authenticated;
grant execute on function public.release_checkout_payment_claim(uuid,uuid) to service_role;

create or replace function public.mark_razorpay_payment_captured(
  p_provider_order_id text,
  p_provider_payment_id text,
  p_amount_paise bigint,
  p_event_id text,
  p_event_type text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_payment public.payments%rowtype;
  v_order public.orders%rowtype;
  v_duplicate boolean := false;
begin
  if coalesce(auth.role(),'') <> 'service_role' then raise exception 'Trusted server access required'; end if;
  if p_event_id is null or p_event_id='' then raise exception 'Missing payment event id'; end if;

  insert into public.payment_events(provider_event_id,event_type,payload_redacted,signature_verified,processed_at)
  values(p_event_id,p_event_type,jsonb_build_object('provider_order_id',p_provider_order_id,
    'provider_payment_id',p_provider_payment_id,'amount_paise',p_amount_paise),true,now())
  on conflict(provider_event_id) do nothing;
  if not found then
    select p.order_id into v_order.id from public.payments p where p.provider_order_id=p_provider_order_id;
    return v_order.id;
  end if;

  select * into v_payment from public.payments p
  where p.provider_order_id=p_provider_order_id for update;
  if not found then raise exception 'Payment order not found'; end if;
  if v_payment.amount_paise<>p_amount_paise or v_payment.currency<>'INR' then
    raise exception 'Payment amount or currency mismatch';
  end if;
  if v_payment.status='captured' then
    update public.payments set provider_payment_id=coalesce(provider_payment_id,p_provider_payment_id),
      verified_at=coalesce(verified_at,now()) where id=v_payment.id;
    return v_payment.order_id;
  end if;
  select * into v_order from public.orders where id=v_payment.order_id for update;
  if v_order.status not in ('pending_payment','paid') then raise exception 'Order is not payable'; end if;

  update public.payments set status='captured',provider_payment_id=p_provider_payment_id,verified_at=now()
  where id=v_payment.id;
  if v_order.status='pending_payment' then
    update public.orders set status='paid' where id=v_order.id;
    insert into public.order_status_history(order_id,from_status,to_status,actor_id,note)
    values(v_order.id,'pending_payment','paid',null,'Payment captured and verified');
    update public.payment_events set payment_id=v_payment.id where provider_event_id=p_event_id;
    update public.carts c set updated_at=now() where c.user_id=v_order.user_id;
    update public.cart_items ci set quantity=ci.quantity-oi.quantity,updated_at=now()
    from public.order_items oi,public.carts c
    where oi.order_id=v_order.id and c.user_id=v_order.user_id
      and ci.cart_id=c.id and ci.variant_id=oi.variant_id and ci.quantity>oi.quantity;
    delete from public.cart_items ci using public.order_items oi,public.carts c
    where oi.order_id=v_order.id and c.user_id=v_order.user_id
      and ci.cart_id=c.id and ci.variant_id=oi.variant_id and ci.quantity<=oi.quantity;
  end if;
  update public.payment_events set payment_id=v_payment.id where provider_event_id=p_event_id;
  return v_payment.order_id;
end;
$$;
revoke all on function public.mark_razorpay_payment_captured(text,text,bigint,text,text) from public,anon,authenticated;
grant execute on function public.mark_razorpay_payment_captured(text,text,bigint,text,text) to service_role;

commit;
