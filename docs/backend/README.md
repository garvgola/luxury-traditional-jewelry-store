# Backend and Supabase integration handoff

## Current implementation

The repository now contains a Next.js 15 / React 19 / TypeScript application and a Supabase/PostgreSQL backend foundation.

Implemented code includes:
- Customer profile and role provisioning through Supabase Auth trigger.
- Customer-owned addresses, cart and wishlist.
- Product categories, products, variants, availability and product image metadata.
- Owner-managed shipping zones/rates and a server-only shipping quote RPC.
- Orders, order items, payments, payment events, order history and admin audit records in the schema.
- RLS policies on application tables.
- Server-side customer APIs, admin role checks, private product media upload/read policies and shipping quote integration.

The presence of schema tables for orders/payments does not mean the checkout/payment workflow is implemented. Razorpay order creation, signature verification, webhooks and order creation remain outstanding.

## Migration sequence

Apply to a disposable **development** Supabase project in this order:

1. `supabase/migrations/20261121000100_backend_foundation.sql`
2. `supabase/migrations/20261121000200_default_customer_address.sql`
3. `supabase/migrations/20261121000300_admin_product_creation.sql`
4. `supabase/migrations/20261121000400_product_media_storage.sql`
5. `supabase/migrations/20261121000500_seed_store_categories.sql`

Do not apply to production until reviewed, backed up and approved.

## Apply and test

1. Create a Supabase development project.
2. Copy `.env.example` to `.env.local` and fill development-only values.
3. Install/use the Supabase CLI and link the development project.
4. Review all five migrations, then run `supabase db push`.
5. Run `supabase test db` after enabling pgTAP.
6. Create the owner Auth account and grant the `admin` role using `docs/backend/ADMIN_BOOTSTRAP.md`.
7. Configure `SUPABASE_SERVICE_ROLE_KEY` on the server only for `quote_shipping`.
8. Configure shipping zones/rates through `/admin/shipping`.
9. Upload a test product image through `/admin/products` and verify anonymous signed-read behavior.

**Important:** These migrations have not yet been applied to a Supabase instance in this environment. Runtime RLS, storage and RPC behavior remains unverified.

## Release-one data and security rules

- INR monetary values are integer paise.
- Availability is owner-managed; no quantity inventory or automatic stock decrement in release one.
- Customer operations require a signed-in user and are constrained by user ownership and RLS.
- Admin actions require the admin role server-side and in RLS.
- Product media is private; anonymous reads are limited to images linked to active products.
- Shipping quote is server-only and uses database prices and configured postal-code zones.
- Order/payment writes are not exposed to customer RLS policies.
- No guest checkout, courier API, returns/refunds or live payment activation in release one.

## Remaining backend work

- Runtime RLS tests with anonymous, customer A, customer B and admin identities.
- Atomic checkout/order creation and inventory/availability revalidation.
- Tax/GST and invoice policy from owner/accountant.
- Razorpay test order creation, payment signature verification, webhook verification and idempotent payment events.
- Order status transitions, fulfilment, cancellation and refunds if approved.
- Email notifications and operational audit review.
