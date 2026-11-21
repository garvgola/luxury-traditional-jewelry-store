# Project Status

**Repository:** garvgola/luxury-traditional-jewelry-store  
**Brand:** NAMO NAMO jewels  
**Integrated branch:** `develop`  
**Current phase:** Phase 2 — backend-connected customer and admin experience  
**Last updated:** 2026-11-21

## Verified repository state

- [x] Existing repository retained; no duplicate repository created.
- [x] `main` retained as the stable baseline; `develop` is the integration branch.
- [x] Phase 0 architecture, API, database and security contracts approved by the owner in the earlier project workflow.
- [x] Phase 1 heritage-fusion design direction approved by the owner.
- [x] PRs #8–#17 merged into `develop`.
- [x] Integration CI has passed on the feature PRs: install, TypeScript, ESLint, production build and Playwright smoke tests.
- [x] Feature PRs #8–#17 merged into `develop`.
- [ ] Documentation reconciliation PR #18 is open for review.

## Implemented in `develop`

### Storefront and customer experience
- [x] Responsive Next.js 15 / React 19 / TypeScript storefront.
- [x] Supabase browser/server clients and cookie-based session refresh.
- [x] Customer sign-up, sign-in, email confirmation and sign-out.
- [x] Customer account page and recent order history.
- [x] Database-backed product catalogue, product details, category pages and search.
- [x] Persistent authenticated cart API/UI: read, add, quantity update and remove.
- [x] Customer wishlist API/UI: read, save and remove.
- [x] Customer delivery-address CRUD and atomic default-address switching.
- [x] Product image rendering through signed URLs for published products.

### Administration
- [x] Server-side admin role gate.
- [x] Dashboard metrics and read-only recent order listing.
- [x] Product creation with initial variant, availability updates and archive.
- [x] Category creation, activation/deactivation and product category assignment.
- [x] Admin shipping-zone/rate management.
- [x] Admin product image upload to a private storage bucket.

### Checkout and quality
- [x] Authenticated server-side shipping quote endpoint using database prices and the restricted quote RPC.
- [x] Checkout shipping-estimate screen; no false payment success or order creation.
- [x] Playwright smoke tests for homepage, catalogue empty state, login, signup, cart backend-unconfigured state and mobile navigation.
- [x] GitHub Actions runs install, TypeScript, ESLint, production build, Chromium setup and Playwright tests.

## External configuration and runtime verification still required

- [ ] Create a disposable development Supabase project and configure `.env.local`.
- [ ] Apply migrations 00100 through 00500 in order.
- [ ] Run pgTAP database tests; they have not been executed against a Supabase instance.
- [ ] Create the owner Auth account and grant the `admin` role using `docs/backend/ADMIN_BOOTSTRAP.md`.
- [ ] Configure the server-only Supabase service-role key.
- [ ] Test authentication, customer RLS isolation, cart, wishlist, address CRUD, admin authorization and storage policies against the development project.
- [ ] Configure shipping zones/rates and test the quote endpoint with real test addresses.
- [ ] Add real catalogue records and owner-approved product photography.
- [x] Production checkout/payment code added on `feature/production-checkout-payments`: atomic order snapshot, idempotency, Razorpay order creation, signature verification, captured/failed webhook reconciliation and customer order detail.
- [ ] Apply migration 006 and run pgTAP against development Supabase.
- [ ] Configure Razorpay test keys/webhook and validate successful, failed, duplicate and delayed events.
- [ ] Confirm GST/HSN, seller registration, state/place-of-supply, freight tax, invoice numbering and price-inclusion treatment with owner/accountant.
- [x] Razorpay order creation, HMAC/API payment verification, signed captured/failed webhook reconciliation and idempotent order updates added on `feature/production-checkout-payments`.
- [x] Admin fulfilment transitions paid → processing → shipped → delivered, with carrier/tracking and audit history, added on `feature/production-checkout-payments`.
- [ ] Merge PR #19 after the latest CI run passes.
- [ ] Apply migration 006 and run pgTAP against development Supabase.
- [ ] Verify Razorpay test payments, failed payments, duplicate/delayed webhooks and payment reconciliation against merchant test credentials.
- [ ] Complete checkout, order confirmation, email notifications and order history testing.
- [ ] Complete refunds/cancellations, product variant price editing, image ordering and remaining management workflows.
- [ ] Run full browser, accessibility, security and performance testing.
- [ ] Configure Vercel and verify a deployment before claiming a live URL.

## Current limitations

- Supabase credentials are not available in this development environment. Code and CI are validated, but live database-backed flows are not yet runtime-verified.
- The database migration and pgTAP suite have not been applied/executed against a real Supabase project.
- No real product catalogue or owner-approved product photography has been supplied; no products or sales data are fabricated.
- Checkout/payment and basic admin fulfilment code is implemented but must remain inactive until Supabase migration 006, test credentials, tax/invoice rules and webhook runtime tests are completed. GST split/invoice engine, refunds and notifications remain outstanding.
- No production deployment exists or has been verified.

## Confirmed release-one business rules

- Visitors may browse without an account; sign-in is required before checkout.
- Product availability is owner-managed; no per-variant quantity inventory or automatic stock decrement in release one.
- Shipping is location-based and owner-configured by postal-code zone/rate.
- Delivery estimates are indicative, not guaranteed.
- No courier API, guest checkout or returns/refunds workflow in release one.
- All INR monetary values are integer paise.

## Release controls

- No live Razorpay payments without explicit owner approval.
- No production deployment without QA sign-off and explicit owner approval.
- No production migration or destructive data change without owner approval.
- Never commit secrets or real customer data.
- Mark a feature runtime-complete only after external configuration and test evidence exist.

## Next actions

1. Configure the development Supabase project, apply all five migrations and run pgTAP tests.
2. Bootstrap the owner admin account and configure the server-only service-role key.
3. Test authentication, RLS, cart, wishlist, addresses, category/product CRUD, media and shipping quote flows.
4. Confirm tax/GST and invoice rules with the owner/accountant.
5. Implement and test Razorpay test mode with server-side signatures, verified webhooks and idempotent order updates.
6. Complete remaining admin workflows and full QA.
7. Configure and verify Vercel deployment only after the above release gates pass.
