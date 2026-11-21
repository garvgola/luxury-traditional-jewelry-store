# Integration Guide

**Status:** Phase 0 draft

## 1. Source-of-truth boundaries

- Agent 0 owns cross-system architecture and shared contracts.
- Agent 1 owns design tokens and interaction specifications.
- Agent 3 owns database schema, migrations, RLS, and trusted data operations.
- Agent 4 owns authentication configuration and role lifecycle in coordination with Agent 3.
- Agent 5 owns checkout/payment lifecycle and coordinates inventory/order transactions with Agent 3.
- Agent 2 consumes approved UI and API contracts.
- Agent 6 consumes approved role, order, catalogue, and inventory contracts.
- Agent 7 independently validates behavior.
- Agent 8 owns CI and deployment configuration.

## 2. Shared conventions

- TypeScript strict mode should be enabled.
- Use a consistent lint/format configuration and shared validation schemas.
- Use integer paise for INR values.
- Use UTC timestamps in storage and render local time intentionally.
- Use stable, documented status enums and avoid ad-hoc strings.
- Keep provider-specific code behind service modules.
- Log request IDs and operational events without logging credentials or unnecessary personal data.

## 3. Environment variables

Create local environment files from a committed example template once the implementation framework is initialized. Commit placeholder names only, never real values.

Expected server-only configuration will include Supabase project URL and service-role key, Razorpay key secret and webhook secret, and email-provider credentials if selected. Public browser configuration must be explicitly allowlisted (for example, Supabase URL and anon key, and Razorpay public key ID). Confirm exact variable names during implementation.

## 4. Integration sequence

1. Approve architecture, data model, API, and security contracts.
2. Establish repository conventions, CI, and environment templates.
3. Implement schema migrations and RLS; test using separate anonymous, customer, and admin identities.
4. Implement authentication/session integration.
5. Implement catalogue and customer UI against typed API contracts.
6. Implement checkout, inventory reservation, and payment state machine.
7. Implement admin operations with role and audit controls.
8. Run independent end-to-end and security testing.
9. Deploy to preview/staging; obtain explicit approval before production.

## 5. Pull request requirements

Every PR should state scope, linked issue, design/API/schema changes, test evidence, security implications, migration/rollback notes, and screenshots for UI changes. Require review from the relevant code owner and Agent 0 for cross-boundary changes. Do not merge failing CI or unresolved critical/high-severity security findings.

## 6. Integration failure handling

Use timeouts, bounded retries, idempotency, structured errors, and safe fallbacks. Do not retry non-idempotent payment or inventory mutations without an idempotency strategy. Provider outages must not create duplicate orders or falsely mark payments successful.
