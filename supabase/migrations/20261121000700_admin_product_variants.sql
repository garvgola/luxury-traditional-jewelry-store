-- Admin-managed additional sellable variants for existing catalogue products.
begin;

create or replace function public.admin_add_product_variant(
  p_product_id uuid,
  p_variant_label text,
  p_sku text,
  p_price_paise bigint,
  p_availability public.product_availability_status,
  p_hsn_code text,
  p_gst_rate_bps integer,
  p_price_includes_tax boolean
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $fn$
declare
  v_variant_id uuid;
begin
  if not public.has_role('admin') then raise exception 'Administrator access required'; end if;
  if not exists(select 1 from public.products where id=p_product_id and status='active') then
    raise exception 'Active product not found';
  end if;
  if p_variant_label is null or length(trim(p_variant_label))<1 or length(trim(p_variant_label))>100
     or p_price_paise is null or p_price_paise<=0 or p_price_paise>1000000000
     or p_hsn_code is null or length(p_hsn_code) not between 4 and 8
     or translate(p_hsn_code,'0123456789','')<>''
     or p_gst_rate_bps is null or p_gst_rate_bps not between 0 and 2800
     or p_price_includes_tax is null then
    raise exception 'Valid variant, price and tax classification are required';
  end if;
  insert into public.product_variants(
    product_id,variant_label,sku,price_paise,hsn_code,gst_rate_bps,price_includes_tax,is_active
  ) values(
    p_product_id,trim(p_variant_label),nullif(trim(p_sku),''),p_price_paise,
    trim(p_hsn_code),p_gst_rate_bps,p_price_includes_tax,true
  ) returning id into v_variant_id;
  insert into public.product_availability(variant_id,availability,updated_by)
  values(v_variant_id,p_availability,(select auth.uid()));
  return v_variant_id;
end;
$fn$;
revoke all on function public.admin_add_product_variant(uuid,text,text,bigint,public.product_availability_status,text,integer,boolean) from public,anon;
grant execute on function public.admin_add_product_variant(uuid,text,text,bigint,public.product_availability_status,text,integer,boolean) to authenticated;

commit;
