# NAMO NAMO jewels

A heritage-fusion Indian jewellery storefront built with Next.js, TypeScript, Tailwind CSS, Supabase/PostgreSQL and Razorpay (payment integration is not yet enabled).

## Current delivery status

**Development branch:** `develop`  
**Active workstream:** Customer experience  
**Release state:** Development only — not production ready.

The integrated foundation currently includes:
- Responsive Next.js storefront shell and heritage-fusion design system.
- Supabase/PostgreSQL schema proposal implemented as a migration with Row Level Security policies.
- Customer profiles, addresses, catalogue, product variants, owner-managed availability, carts, wishlists, orders, payments, shipping zones/rates and audit records.
- Authenticated sign-up/sign-in scaffolding and customer account view.
- Catalogue reads, product detail route and authenticated cart API/UI.

The customer experience and admin foundations have been merged into `develop`. Shipping-zone administration and secure shipping estimates are in the current review workstream. Supabase migration execution, live authentication, product media, checkout, Razorpay, admin workflows, end-to-end tests and deployment remain incomplete.

## Technology

- Next.js 15, React 19, TypeScript
- Tailwind CSS
- Supabase Auth, PostgreSQL and Storage (Storage bucket/policies still to be configured)
- Zod validation
- Razorpay (planned; no live payment activation)
- GitHub Actions CI
- Vercel (deployment not yet configured)

## Local development

1. Install Node.js 22 or later.
2. Install dependencies: `npm install`.
3. Copy `.env.example` to `.env.local`.
4. Configure the Supabase project URL and anon/publishable key.
5. Start the app: `npm run dev`.

The public storefront can render without credentials, but authentication, catalogue reads and cart operations require a configured Supabase project and the reviewed migration.

## Supabase setup

1. Create a development Supabase project (not production).
2. Configure the variables in `.env.local`.
3. Review `supabase/migrations/20261121000100_backend_foundation.sql`.
4. Apply the migration to the development project with the Supabase CLI.
5. Run `supabase test db` after enabling pgTAP.
6. Configure product media storage and policies before uploading catalogue images.

Do not commit `.env.local`, service-role keys, payment secrets or customer data.

## Business rules for release one

- Public browsing is allowed; sign-in is required before checkout.
- Product availability is manually managed; there is no quantity inventory or automatic stock decrement.
- Shipping is owner-configured by postal-code zone and subtotal threshold. Delivery windows are indicative.
- No courier API, returns/refunds workflow or guest checkout in release one.
- INR amounts are stored as integer paise.
- Checkout and payment status must be server-authoritative.
- Live Razorpay payments and production deployment require explicit owner approval.

## Engineering safeguards

- Enforce customer ownership and administrator access on the server and through RLS.
- Never expose the Supabase service-role key to the browser.
- Verify Razorpay signatures and webhooks on the server before marking an order paid.
- Never trust client-submitted prices, totals, stock or payment status.
- Do not claim a migration, test, payment or deployment succeeded until it has been executed and verified.

See `PROJECT_STATUS.md`, `ARCHITECTURE.md`, `DATABASE_SCHEMA.md`, `API_CONTRACTS.md`, `DESIGN_SYSTEM.md`, `SECURITY_STANDARDS.md` and `docs/backend/README.md` for the current implementation contracts and limitations.
