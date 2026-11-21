# Luxury Traditional Jewellery Store

A premium traditional Indian jewellery e-commerce experience.

## Project status

**Current phase:** Phase 0 — Architecture audit and project foundation  
**Status:** Repository initialization and architecture baseline

## Planned technology stack

- Next.js, React, TypeScript
- Tailwind CSS
- Supabase and PostgreSQL
- Razorpay for payments
- Vercel for deployment
- GitHub for source control and collaboration

## Design direction

A refined traditional-luxury identity using deep burgundy, antique gold, ivory, champagne beige, and muted earthy tones. Typography will pair elegant serif headings with a clean sans-serif body font.

## Engineering principles

- Keep secrets and production customer data out of source control.
- Enforce authorization on the server and database using Supabase Row Level Security.
- Store INR monetary values as integer paise.
- Verify Razorpay payment signatures and webhooks on the server.
- Make inventory reservation and decrement operations atomic to reduce overselling.
- Do not enable live payments or production deployment without explicit approval.
- Do not begin feature implementation until the Phase 0 architecture gate is approved.

## Phase 0 deliverables

- `ARCHITECTURE.md`
- `DATABASE_SCHEMA.md`
- `API_CONTRACTS.md`
- `AGENT_ASSIGNMENTS.md`
- `INTEGRATION_GUIDE.md`
- `SECURITY_STANDARDS.md`
- `PROJECT_STATUS.md`

See [Phase 0 tracking issue](https://github.com/garvgola/luxury-traditional-jewelry-store/issues/1).

## Development workflow

Work is organized into gated phases. Each specialist workstream must follow the shared contracts, document dependencies, and request human approval when a decision affects scope, cost, security, production data, or payment activation.

## Disclaimer

This repository is being initialized. Architecture and implementation details remain subject to the Phase 0 review and approval.
