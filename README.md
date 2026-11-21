# NAMO NAMO jewels

A heritage-fusion Indian jewellery e-commerce storefront built with Next.js, TypeScript, Tailwind CSS, Supabase/PostgreSQL, Supabase Storage and Razorpay checkout code. Payments are not enabled until external validation is complete.

## Current delivery status

**Repository:** `garvgola/luxury-traditional-jewelry-store`  
**Integrated branch:** `develop`  
**Release state:** Development foundation implemented; not production ready.

### Implemented in `develop`

- Responsive heritage-fusion storefront shell and approved design direction.
- Supabase browser/server clients, session refresh, sign-up, sign-in, email confirmation and sign-out.
- Customer account, saved wishlist, persistent cart and delivery-address CRUD.
- Database-backed product catalogue, product detail, category pages, product search and selectable product variants.
- Product galleries with signed private images, image ordering, alt-text management and admin uploads.
- Admin product metadata, price/SKU, tax classification and variant management.
- Admin role gate, dashboard metrics, product/category/variant management, availability management and product archive.
- Admin order fulfilment transitions and shipment tracking.
- Admin-managed shipping zones/rates and server-side shipping estimates.
- Private product-media bucket, admin-only uploads and signed image URLs for published products.
- Razorpay order creation, HMAC/API payment verification, signed captured/failed webhooks and idempotent order finalization.
- Customer order confirmation/details and admin fulfilment tracking.
- Security response headers and baseline CSP.
- GitHub Actions CI: dependency install, TypeScript, ESLint, production build and Playwright browser smoke tests.

## Not yet production-ready

- No Supabase project has been configured in this development environment; migrations have not been applied to a live database.
- Authentication, RLS, storage policies, cart, wishlist, address and shipping operations have not been runtime-tested against a Supabase instance.
- No owner catalogue records or approved jewellery photography have been supplied. The site uses honest empty states and neutral placeholders until real products are entered.
- Checkout now includes atomic server-side order creation, Razorpay order creation, HMAC/API verification, signed webhook reconciliation and admin order fulfilment transitions. It remains inactive until credentials, migrations, tax setup and runtime verification are completed.
- GST/tax and invoice treatment need owner/accountant confirmation before calculating a final payable amount.
- Razorpay integration code is not runtime-tested against merchant credentials or a configured webhook.
- Refunds, partial refunds, cancellations after payment, disputes and transactional email notifications are not implemented.
- GST split/invoice engine, shipping tax treatment, refunds/cancellations, transactional notifications and complete sales reporting remain outstanding.
- Full end-to-end checkout, security, accessibility and performance testing remains outstanding.
- No Vercel deployment or production URL has been verified.

## Technology

- Next.js 15, React 19, TypeScript
- Tailwind CSS
- Supabase Auth, PostgreSQL and Storage
- Zod validation
- Playwright browser smoke tests
- GitHub Actions CI
- Vercel deployment target (not configured)

## Local development

1. Install Node.js 22 or later.
2. Run `npm install`.
3. Copy `.env.example` to `.env.local`.
4. Configure the Supabase URL and publishable/anon key.
5. Run `npm run dev`.

Without Supabase credentials, public pages render their configuration/empty states; authentication and database-backed actions will not work.

## Supabase development setup

Apply migrations in this order to a disposable **development** Supabase project:

1. `20261121000100_backend_foundation.sql`
2. `20261121000200_default_customer_address.sql`
3. `20261121000300_admin_product_creation.sql`
4. `20261121000400_product_media_storage.sql`
5. `20261121000500_seed_store_categories.sql`
6. `20261121000600_production_checkout_payments.sql`
7. `20261121000700_admin_product_variants.sql`

Then:
- Run the pgTAP tests in `supabase/tests`.
- Create the owner account and grant the admin role using `docs/backend/ADMIN_BOOTSTRAP.md`.
- Configure `SUPABASE_SERVICE_ROLE_KEY` server-side only for trusted shipping, checkout and payment RPCs.
- Configure Razorpay test keys and webhook secret server-side using `docs/backend/PRODUCTION_CHECKOUT.md`.
- Configure owner-managed shipping zones/rates in `/admin/shipping`.
- Upload owner-approved product images in `/admin/products`.

Never commit `.env.local`, service-role keys, Razorpay secrets or customer data.

## Release-one business rules

- Public browsing is allowed; sign-in is required before checkout.
- Product availability is manually managed; there is no quantity inventory or automatic stock decrement.
- Shipping is configured by postal-code zone and subtotal threshold; delivery windows are indicative.
- No courier API, guest checkout, returns/refunds or dispute workflow in release one; admin fulfilment status is manually managed.
- INR monetary values are integer paise.
- Prices, tax, shipping, orders and payment state must be calculated/verified server-side.
- Live Razorpay payments and production deployment require explicit owner approval.

## Security rules

- Enforce customer ownership and administrator access server-side and through RLS.
- Never expose the Supabase service-role key to the browser.
- Only published product images are publicly readable; uploads require admin access.
- Verify Razorpay signatures and webhooks before marking an order paid.
- Never trust client-submitted prices, totals, inventory or payment status.
- Do not claim migrations, tests, payments or deployment succeeded until executed and verified.

## Project documentation

- `PROJECT_STATUS.md`
- `ARCHITECTURE.md`
- `DATABASE_SCHEMA.md`
- `API_CONTRACTS.md`
- `DESIGN_SYSTEM.md`
- `SECURITY_STANDARDS.md`
- `docs/backend/ADMIN_BOOTSTRAP.md`
- `docs/backend/PRODUCT_MEDIA.md`
- `docs/backend/PRODUCTION_CHECKOUT.md`
- `DEPLOYMENT_PLAN.md`
- `SECURITY_AUDIT.md`
- `TEST_REPORT.md`
- `ISSUE_REGISTER.md`
