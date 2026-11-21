-- Admin-only atomic creation of a product and its first variant.
create or replace function public.admin_create_product(
  p_name text,
  p_slug text,
  p_description text,
  p_category_id uuid,
  p_price_paise bigint,
  p_sku text,
  p_variant_label text,
  p_availability public.product_availability_status
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  new_product_id uuid;
  new_variant_id uuid;
begin
  if not public.has_role('admin') then
    raise exception 'Administrator access required';
  end if;
  if p_price_paise < 0 then
    raise exception 'Price must not be negative';
  end if;

  insert into public.products(category_id,name,slug,description,status)
  values(p_category_id,trim(p_name),trim(p_slug),nullif(trim(p_description),''),'active')
  returning id into new_product_id;

  insert into public.product_variants(product_id,sku,variant_label,price_paise)
  values(new_product_id,nullif(trim(p_sku),''),coalesce(nullif(trim(p_variant_label),''),'Default'),p_price_paise)
  returning id into new_variant_id;

  insert into public.product_availability(variant_id,availability,updated_by)
  values(new_variant_id,p_availability,(select auth.uid()));

  return new_product_id;
end;
$$;

revoke all on function public.admin_create_product(text,text,text,uuid,bigint,text,text,public.product_availability_status) from public;
grant execute on function public.admin_create_product(text,text,text,uuid,bigint,text,text,public.product_availability_status) to authenticated;
