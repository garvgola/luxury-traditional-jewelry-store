# Security Audit

**Assessment type:** Preliminary code/design review  
**Formal penetration test:** Not performed  
**Runtime Supabase policy verification:** Not performed  
**Release recommendation:** Do not deploy to production yet.

## Controls present in code

- Supabase browser and server clients use cookie-based SSR.
- Server-side routes call `auth.getUser()` before customer data operations.
- Admin pages and admin APIs check the authenticated user's `admin` role.
- Database RLS policies are included in the base migration.
- Customer cart, wishlist and address operations scope queries to the signed-in user.
- Product and shipping quote amounts are read/calculated server-side from database records.
- Supabase service-role key is loaded only by a server-only module for the restricted shipping quote RPC.
- Product-media bucket is private; uploads require admin authorization and public reads are restricted to images linked to active products.
- Zod validation is used on key write APIs.
- Checkout does not create orders or claim successful payments while tax/payment setup is incomplete.

## Findings and limitations

1. **Critical — runtime authorization unverified.** Migrations have not been applied to a Supabase project; RLS behavior is not proven.
2. **High — payment surface incomplete.** Razorpay order creation, signature verification, webhook verification, replay/idempotency and refund flows are not implemented.
3. **High — admin bootstrap required.** Owner account must be explicitly granted the admin role through a trusted Supabase SQL session.
4. **High — service-role secret required.** Shipping quote code requires a server-only key; environment isolation has not been verified in Vercel.
5. **Medium — storage policies unverified.** Private bucket policies and signed URLs need anonymous/customer/admin permission tests.
6. **Medium — API abuse controls.** Rate limiting, abuse monitoring and request-size limits need a production review.
7. **Medium — privacy/compliance.** Privacy policy, terms, refund/return policy, GST/invoice requirements and retention policy need owner/legal review.

## Required security tests before release

- Anonymous access to private customer records.
- Customer A attempting to read/update Customer B's cart, wishlist, addresses and orders.
- Non-admin attempting admin pages, APIs, storage uploads and product mutations.
- Admin session expiry and role revocation.
- Storage read of unlinked image and image for archived product.
- SQL injection/XSS input handling.
- CSRF/session behavior for state-changing routes.
- Shipping quote tampering and price manipulation.
- Payment signature tampering, webhook signature failure, duplicate/replayed webhook and mismatched order/payment IDs.

No security certification or production approval is claimed.
