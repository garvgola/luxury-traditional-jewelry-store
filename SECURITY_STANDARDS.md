# Security Standards

**Status:** Minimum engineering baseline; review before implementation

## 1. Secrets and configuration
- Never commit API keys, service-role keys, database passwords, webhook secrets, private certificates, or production environment files.
- Keep privileged credentials server-only; do not prefix them with public/client exposure variables.
- Use separate credentials and projects for development, staging, and production.
- Rotate credentials immediately after suspected exposure.

## 2. Authentication and authorization
- Use Supabase Auth for identity and secure session handling.
- Enforce authorization on the server for every privileged action.
- Apply RLS to all customer-owned and sensitive tables.
- Deny by default; grant only the minimum required access.
- Never trust role, user ID, price, or ownership claims supplied by the browser.
- Admin access must require a trusted role assignment and server-side verification.

## 3. Payments
- Create Razorpay orders only from trusted server code.
- Recalculate payable amounts from authoritative database values.
- Verify checkout signatures server-side and verify webhook signatures using the raw body.
- Make webhook handling idempotent and record verified provider events.
- Never store card numbers, CVVs, UPI PINs, or payment credentials.
- Keep live keys and production payment activation disabled until owner approval and QA sign-off.

## 4. Data protection
- Collect only data necessary for the approved customer journey.
- Restrict access to addresses, phone numbers, order history, and other personal data.
- Avoid placing personal data or secrets in logs, analytics events, test fixtures, or screenshots.
- Define retention, deletion, export, and incident-response processes before launch.
- Use synthetic or anonymized data in development and QA.

## 5. Application security
- Validate and normalize all untrusted input on the server.
- Use parameterized database access; avoid unsafe dynamic SQL.
- Protect state-changing requests against CSRF where applicable.
- Apply rate limits and abuse controls to login, recovery, checkout, coupon, and webhook-adjacent flows.
- Use secure headers, HTTPS, safe cookie settings, and dependency updates.
- Sanitize user-generated content before rendering.

## 6. Inventory and order integrity
- Use atomic database transactions or guarded SQL functions for inventory reservation and release.
- Enforce legal state transitions for orders and payments.
- Prevent replay and duplicate processing using unique event IDs and idempotency keys.
- Record audit events for admin changes to price, inventory, order status, and roles.

## 7. Release gates
- No critical/high severity security findings.
- RLS tests pass for anonymous, customer A, customer B, and admin contexts.
- Payment signature and webhook tests pass, including replay/duplicate events.
- Secret scanning and dependency checks pass.
- Backups and rollback/recovery steps are documented.
- Owner explicitly approves production deployment and live payments.

## 8. Incident response
Document how to triage, contain, rotate credentials, preserve evidence, notify affected parties where required, and recover safely. Applicable legal obligations must be confirmed with qualified counsel; this document is not legal advice.
