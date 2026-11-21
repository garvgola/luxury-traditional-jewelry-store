# Test Report

**Current state:** CI-validated application code; runtime integration tests remain incomplete.

## Automated CI

GitHub Actions runs dependency installation, TypeScript, ESLint, production build, Chromium installation and Playwright browser smoke tests.

Feature PRs #8–#21 passed their required checks before merge. The latest post-merge develop workflow must also complete successfully.

## Playwright smoke coverage

- Homepage hero and primary navigation.
- Catalogue configuration/empty state when Supabase is not configured.
- Checkout configuration empty state.
- Sign-in and registration screens.
- Cart backend-unconfigured state.
- Mobile navigation and account link.
- Production security headers.

## Added but not runtime-tested against external services

- Supabase migrations 00100–00700 and pgTAP assertions.
- Authentication/email confirmation and customer RLS isolation.
- Cart, wishlist, address and product/category/variant CRUD.
- Private media upload, signed reads, image ordering and deletion.
- Shipping quotes with real configured zones and PIN codes.
- Razorpay order creation, payment API verification and signed captured/failed webhooks.
- Admin fulfilment transitions and shipment tracking.

## Not yet tested or implemented

- Full checkout with Razorpay test credentials.
- Refunds, partial refunds, cancellations, disputes and chargebacks.
- Transactional email delivery and retry behavior.
- GST invoice split, freight tax and legally reviewed invoice output.
- Full accessibility, penetration/security, cross-browser, load and performance testing.
- Vercel preview/production deployment and custom domain.

A CI pass proves static checks/build and listed smoke tests only. It does not prove external services, database policies, payments or deployment are operational.
