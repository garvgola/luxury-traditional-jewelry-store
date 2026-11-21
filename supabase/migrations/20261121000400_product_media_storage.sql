-- Private product-media bucket. Published images are readable; only admins can upload or mutate objects.
insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values (
  'product-media',
  'product-media',
  false,
  10485760,
  array['image/jpeg','image/png','image/webp','image/avif']
)
on conflict (id) do update
set public = false,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "admin_upload_product_media" on storage.objects;
create policy "admin_upload_product_media" on storage.objects
for insert to authenticated
with check (bucket_id = 'product-media' and (select public.has_role('admin')));

drop policy if exists "admin_update_product_media" on storage.objects;
create policy "admin_update_product_media" on storage.objects
for update to authenticated
using (bucket_id = 'product-media' and (select public.has_role('admin')))
with check (bucket_id = 'product-media' and (select public.has_role('admin')));

drop policy if exists "admin_delete_product_media" on storage.objects;
create policy "admin_delete_product_media" on storage.objects
for delete to authenticated
using (bucket_id = 'product-media' and (select public.has_role('admin')));

drop policy if exists "read_published_product_media" on storage.objects;
create policy "read_published_product_media" on storage.objects
for select to anon, authenticated
using (
  bucket_id = 'product-media'
  and exists (
    select 1
    from public.product_images image_record
    join public.products product_record on product_record.id = image_record.product_id
    where image_record.storage_path = name
      and product_record.status = 'active'
  )
);
