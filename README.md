# NAMO NAMO jewels

A luxury Indian jewellery storefront built with Next.js, React, TypeScript and Tailwind CSS. The visual direction is heritage fusion: traditional Indian jewellery references presented through a contemporary, accessible shopping experience.

## Current implementation status

The `feature/frontend-foundation` branch contains the initial frontend scaffold, responsive site shell, homepage, shared navigation/footer components, and placeholder routes. The current catalogue is intentionally not populated with invented product claims or stock quantities. Authentication, database integration, checkout, Razorpay, admin operations and production deployment are not implemented yet.

## Run locally

Requirements: Node.js 22 LTS and npm.

```bash
npm install
npm run dev
```

Open http://localhost:3000.

Validation commands:

```bash
npm run typecheck
npm run lint
npm run build
```

## Brand and design references

- `DESIGN_SYSTEM.md` — semantic color, typography, spacing, accessibility and interaction tokens.
- `PAGE_SPECIFICATIONS.md` — storefront and customer flow requirements.
- `COMPONENT_CATALOG.md` — shared UI component contracts.
- `ARCHITECTURE.md`, `DATABASE_SCHEMA.md`, `API_CONTRACTS.md` — approved architecture proposals and service contracts.

## Important implementation constraints

- Public browsing is allowed; a customer account is required before order placement.
- The owner manages product availability manually. Do not expose fabricated stock counts or build per-variant stock reservation for release one.
- Shipping is owner-managed and location-based. The final fee and estimated delivery window must be calculated server-side and shown before payment.
- INR amounts must be represented as integer paise in commerce services.
- Razorpay signatures and webhooks must be verified server-side before an order is marked paid.
- Never commit secrets, live customer data, or payment credentials.
- Do not activate live payments or production deployment without explicit owner approval.

## Branch workflow

- `main`: stable baseline.
- `develop`: integration branch.
- `feature/*`: scoped implementation branches; merge through reviewed pull requests.
