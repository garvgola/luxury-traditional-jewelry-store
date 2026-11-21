# Test Report

**Current state:** CI-validated code; runtime integration tests remain incomplete.

## Automated CI

The GitHub Actions workflow runs:
1. Dependency installation.
2. TypeScript type-check.
3. ESLint.
4. Production build.
5. Chromium installation.
6. Playwright browser smoke tests.

Feature pull requests #8–#17 passed their required CI checks before merge. The post-merge `develop` workflow is checked separately; do not treat a pending run as a pass.

## Playwright smoke coverage

- Homepage hero and primary navigation.
- Catalogue configuration/empty state when Supabase credentials are absent.
- Sign-in form.
- Registration form.
- Cart backend-unconfigured state (ensures no false success).
- Mobile navigation and account link.

## Added checkout/payment code (not runtime-verified)

- Atomic server-side order snapshot with customer idempotency.
- Product HSN/GST configuration and server-side total calculation.
- Razorpay order creation with a short-lived payment claim.
- Payment signature verification and provider API confirmation.
- Signed webhook reconciliation for captured/failed events and duplicate event IDs.
- Customer order detail/confirmation view.

These routes have not been exercised against Supabase or Razorpay test credentials. The pgTAP suite includes new permission/schema assertions, but has not been executed against a Supabase project.

## Not yet tested

- Supabase migrations and pgTAP.
- Registration/email verification against a real Supabase project.
- Customer RLS isolation.
- Cart/wishlist/address database writes.
- Product category and product CRUD against Supabase.
- Storage upload and signed-read policies.
- Shipping quote against real zones/rates.
- Checkout/order creation.
- Razorpay test payment, signature and webhook flows.
- Admin order fulfilment/refunds.
- Cross-browser, accessibility, load and performance tests.

## Acceptance

A CI pass proves static checks/build and the listed smoke tests only. It does not prove that external services, database policies, payments or deployment are operational.
