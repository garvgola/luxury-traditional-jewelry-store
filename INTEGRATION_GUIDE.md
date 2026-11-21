# Integration Guide

**Status:** Active integration guide for the merged `develop` branch.

## 1. Source of truth and responsibility boundaries

- GitHub repository is the source of truth; `develop` is the integration branch and `main` remains the stable baseline.
- Agent 0 owns cross-system architecture, phase gates, contract review and integration.
- Agent 1 owns visual identity, responsive design and interaction specifications.
- Agent 2 owns storefront and customer-facing interfaces.
- Agent 3 owns database schema, migrations, RLS and trusted data operations.
- Agent 4 owns authentication/session lifecycle and role security with Agent 3.
- Agent 5 owns cart, checkout, order and payment lifecycle.
- Agent 6 owns admin operations and catalogue/shipping management.
- Agent 7 independently validates behavior and security.
- Agent 8 owns CI, environment and deployment.
- Agent labels represent responsibility boundaries, not autonomous background processes.

## 2. Current integrated capabilities

- Storefront, category and search pages.
- Customer authentication, account, cart, wishlist and addresses.
- Admin dashboard, product/category management and shipping configuration.
- Private product media upload and signed image reads.
- Server-side shipping estimate.
- CI with TypeScript, ESLint, production build and Playwright smoke tests.

## 3. Shared conventions

- TypeScript strict mode.
- Zod validation at write boundaries.
- Integer paise for INR.
- Server-side authoritative price, shipping, tax, order and payment calculations.
- UTC timestamps in storage; render local time intentionally.
- Supabase RLS and server-side role checks for authorization.
- Keep provider-specific code behind server modules.
- Never log credentials, service-role keys or unnecessary personal data.

## 4. Environment and external services

Public browser configuration:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (or supported anon-key fallback)

Server-only:
- `SUPABASE_SERVICE_ROLE_KEY` (required for the restricted shipping quote RPC)

Razorpay and tax configuration are not implemented yet. Confirm GST/tax/invoice treatment with the owner/accountant before designing the final order amount. Do not invent a tax rate or enable live payments.

## 5. Integration and release sequence

1. Configure a disposable development Supabase project.
2. Apply migrations 00100–00500 and run pgTAP.
3. Bootstrap the owner admin role.
4. Test auth, customer isolation, cart, wishlist, address, product/category CRUD, media policies and shipping quotes.
5. Confirm tax and invoice rules.
6. Implement Razorpay test mode with server-side order creation, signature verification, webhook verification and idempotency.
7. Complete order history, notifications, fulfilment and any approved refund workflow.
8. Run full E2E, security, accessibility and performance testing.
9. Deploy to Vercel preview; obtain owner approval before production.

## 6. Pull request requirements

Every PR should state scope, linked issue, design/API/schema changes, test evidence, security implications, migration/rollback notes, and screenshots for UI changes. Require review from the relevant code owner and Agent 0 for cross-boundary changes. Do not merge failing CI or unresolved critical/high-severity security findings.

## 7. Integration failure handling

Use bounded retries, idempotency, structured errors and safe fallbacks. Do not retry non-idempotent payment or inventory mutations without an idempotency strategy. Provider outages must not create duplicate orders or falsely mark payments successful.
