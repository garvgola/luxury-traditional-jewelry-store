# Security Audit

**Assessment type:** Preliminary code/design review  
**Formal penetration test:** Not performed  
**Runtime Supabase policy verification:** Not performed  
**Release recommendation:** Do not deploy to production yet.

## Controls present in code

- Supabase browser/server clients use cookie-based SSR.
- Server-side customer routes call auth.getUser() before customer data operations.
- Admin pages and APIs check the authenticated user's admin role.
- Database RLS policies are included in migrations.
- Customer cart, wishlist and address operations are scoped to the signed-in user.
- Prices, shipping, checkout order snapshots and payment state are calculated/verified server-side.
- Supabase service-role key is loaded only by a server-only module.
- Product media bucket is private; uploads require admin authorization and public reads are restricted to images linked to active products.
- Razorpay payment callback signatures are HMAC-verified and the provider payment resource is fetched to verify order ID, payment ID, amount, currency and captured status.
- Signed webhook events reconcile captured/failed states with event-ID idempotency.
- Admin fulfilment changes use an admin-checked database function, explicit status transitions and audit history.
- Security response headers include X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy, HSTS and a baseline CSP.
- Checkout blocks payment when required product tax classification is missing.

## Findings and limitations

1. **Critical — runtime authorization unverified.** Migrations have not been applied to Supabase; RLS behavior is not proven.
2. **Critical — payment runtime unverified.** Razorpay order creation, signature verification and webhook reconciliation are implemented in code, but no merchant test credentials/webhook have been configured.
3. **Critical — tax/invoice compliance incomplete.** Product GST rate and inclusive/exclusive treatment are configurable, but GSTIN, seller state, place-of-supply split, freight tax and invoice requirements remain unconfirmed.
4. **High — admin bootstrap required.** Owner account must be explicitly granted the admin role through a trusted Supabase SQL session.
5. **High — secrets/environment isolation.** Service-role and Razorpay secrets need encrypted environment variables and deployment-time verification.
6. **Medium — storage policies unverified.** Private bucket policies and signed URLs need anonymous/customer/admin permission tests.
7. **Medium — API abuse controls.** Rate limiting, abuse monitoring and request-size controls need production review.
8. **Medium — privacy/compliance.** Privacy policy, terms, returns/refunds policy and retention rules need owner/legal review.

## Required tests before release

- Anonymous access to private customer records.
- Customer A attempting to access Customer B's cart, wishlist, addresses and orders.
- Non-admin attempting admin APIs, product mutations and storage uploads.
- Admin session expiry and role revocation.
- Storage reads for unlinked images and archived products.
- XSS/SQL injection input handling and CSRF/session behavior.
- Shipping quote and price tampering.
- Payment signature tampering, webhook signature failure, duplicate/replayed events, mismatched amount/order IDs and delayed events.
- Browser security header/CSP behavior, accessibility and performance.

No security certification or production approval is claimed.
