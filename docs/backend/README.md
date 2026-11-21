# Backend foundation — integration handoff

## Implemented in this branch

- Supabase/PostgreSQL migration for customer identity/profile, role mapping, addresses, catalogue, collections, product media, owner-managed availability, location-based shipping zones/rates, customer carts/wishlists, order snapshots, payment records/events, order history, and admin audit logs.
- Row Level Security is enabled on every application table. Customers can read their own private records; public catalogue reads are limited to active/published data; admin management is guarded by the database role helper.
- New users receive a profile and the non-privileged `customer` role from an auth trigger. Client-side role assignment has no write policy.
- INR monetary values are integer paise. Shipping quotes resolve configured postal-code prefixes and subtotal thresholds on the server; the applied fee and estimated delivery dates have columns on the order.
- SQL regression tests assert core tables, RLS, absence of quantity inventory, and privileged shipping function grants.
- `.env.example` contains placeholders only.

## Apply and test

1. Create a Supabase development project; do not use production credentials.
2. Copy `.env.example` to a local ignored env file and fill in development-only values.
3. Install/use the Supabase CLI and link the development project.
4. Apply the migration with `supabase db push`.
5. Run database tests with `supabase test db`.

The migration is versioned at `supabase/migrations/20261121000100_backend_foundation.sql`.

## Deliberate release-one constraints

No quantity inventory, reservation/decrement, guest checkout, returns/refunds, courier API, or browser-authoritative pricing/payment state. Availability is owner-managed. Order and payment writes are intentionally not exposed through customer RLS policies; a trusted server checkout/payment implementation must own these writes after its API contract is finalized.

## Integration handoff

- **Agent 4 (auth):** Supabase Auth user creation automatically provisions `profiles` and `user_roles(role='customer')`. Admin promotion must be a trusted owner-only operation; never expose a role mutation endpoint to customers.
- **Agent 5 (payments):** `payments` and unique `payment_events.provider_event_id` support verified, idempotent Razorpay webhook processing. The browser must never set payment success. Use the raw webhook body for signature verification.
- **Agent 2 (frontend):** public reads use active catalogue rows; checkout requires a signed-in customer. Cart persistence is customer-only. All prices are paise.
- **Agent 6 (admin):** manage catalogue, product availability and shipping configuration through server-authorized admin operations. Record meaningful changes in `admin_audit_logs`.
- **Agent 7 (QA):** extend the pgTAP suite with authenticated customer A/customer B/admin JWT contexts and exercise actual select/insert/update/delete isolation, auth trigger behavior, and shipping-prefix/threshold precedence.

## Not yet implemented / blocked by repository baseline

The repository does not contain a Next.js app, package manifest, TypeScript configuration, shared validation library, or API route structure. Therefore no framework-specific API handlers, typed server data-access layer, npm lint/typecheck/build, or runnable app-level tests can be added without inventing a second application scaffold that may conflict with Agent 2/4's integration. This PR deliberately establishes the database foundation first. The next integration change should add server-side route handlers and validation after the frontend/runtime scaffold is merged.

## Security notes

- The service-role key is server-only and bypasses RLS; do not import it from client components.
- `quote_shipping` is executable only by Supabase `service_role`; it returns no rate to anonymous/authenticated clients directly.
- Do not expose private customer data in logs or fixtures.
- This migration has not been applied to a Supabase instance in this environment. Review and run it on a disposable development project before production use.
