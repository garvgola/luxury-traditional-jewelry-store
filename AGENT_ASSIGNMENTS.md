# Agent Responsibilities and Phase Gates

**Coordinator:** Agent 0 — Project Supervisor, Technical Architect, Integration Manager  
**Status:** Working agreement for this repository

The agent labels describe responsibility boundaries. They do not imply autonomous background processes. Work is coordinated through reviewed deliverables, commits, issues, and explicit owner decisions.

## Agent 0 — Project Supervisor / Technical Architect
- Own architecture, dependency order, contracts, integration decisions, and phase gates.
- Review specialist outputs for consistency and security.
- Maintain project status and raise owner decisions.
- Block downstream implementation when a required dependency or approval is missing.

## Agent 1 — UI/UX and Design System
- Define brand experience, responsive layouts, accessibility, typography, color tokens, reusable components, and page flows.
- Deliver design tokens, page inventory, interaction states, and responsive specifications.
- Coordinate component contracts with Agent 2.

## Agent 2 — Frontend Engineering
- Implement storefront and customer-facing interfaces using approved contracts.
- Integrate Supabase client safely and call server APIs for privileged operations.
- Provide loading, empty, validation, error, and success states.
- Never embed privileged secrets or calculate authoritative totals client-side.

## Agent 3 — Backend and Database
- Convert approved schema into migrations, constraints, indexes, RLS, and tested server-side operations.
- Implement catalogue, cart, inventory, order, and service-layer contracts as assigned.
- Ensure transactional inventory and order-state operations.

## Agent 4 — Authentication and User Management
- Configure Supabase Auth, session lifecycle, account recovery, profile and address ownership.
- Define customer/admin role enforcement with Agent 3 and Agent 6.
- Prevent self-assignment of privileged roles.

## Agent 5 — Cart, Wishlist, Orders and Payments
- Implement cart validation, checkout quote, order creation, Razorpay integration, signature/webhook verification, idempotency, refunds workflow if approved, and inventory coordination.
- Use server-calculated paise amounts and tested state transitions.
- Keep live payment activation disabled until owner approval.

## Agent 6 — Admin Dashboard
- Implement protected operations for catalogue, stock, orders, and approved reporting.
- Enforce server-side role checks on every privileged action.
- Add auditability for sensitive changes.

## Agent 7 — QA and Security Audit
- Independently test functionality, integrations, authorization, RLS, payment flows, race conditions, accessibility, responsiveness, and failure handling.
- Report reproducible defects and block release for critical/high-severity issues.
- Do not rely solely on implementation completion claims.

## Agent 8 — DevOps and Deployment
- Maintain Git workflow, CI, environment configuration, preview/staging/production separation, deployment checks, and rollback procedure.
- Never publish secrets or enable production payments/deployment without owner approval.

## Phase order and dependencies

0. Architecture audit and project foundation — Agent 0; owner approval required.
1. UI/UX design system — Agent 1; reviewed by Agents 0 and 2.
2. Backend and database foundation — Agent 3; based on approved schema.
3. Authentication and roles — Agent 4 with Agents 3 and 6.
4. Frontend storefront and customer experience — Agent 2 using approved API/design contracts.
5. Cart, orders, inventory and payments — Agent 5 with Agents 2, 3, and 4.
6. Admin dashboard — Agent 6 with Agents 3 and 4.
7. Independent QA and security audit — Agent 7 across all completed work.
8. Deployment and production readiness — Agent 8 after QA and owner approval.

## Human-intervention triggers

Ask the owner before decisions affecting budget, paid services, domain purchase, legal/tax/returns policy, personal-data collection, third-party processors, irreversible data changes, production credentials, live payments, or production deployment.
