# Product media storage

The storefront stores product images in a private Supabase Storage bucket named `product-media`.

## Access rules

- Only authenticated users with the `admin` role can upload, update or delete objects.
- Public visitors can receive signed URLs only for image objects linked through `public.product_images` to an active product.
- Unlinked objects and images belonging to archived products are not publicly readable.
- Allowed formats: JPEG, PNG, WebP and AVIF.
- Maximum file size: 10 MB.

## Setup

1. Apply `supabase/migrations/20261121000400_product_media_storage.sql` after the base schema migration.
2. Confirm the bucket is private.
3. Grant the owner account the admin role using `ADMIN_BOOTSTRAP.md`.
4. Upload a test image from `/admin/products`.
5. Confirm that the image appears on the active product detail and collection pages.
6. Confirm that an unlinked object cannot be read by an anonymous visitor.

The admin UI uploads the object first, then inserts a row in `product_images`. If the metadata insert fails, it attempts to remove the uploaded object.
