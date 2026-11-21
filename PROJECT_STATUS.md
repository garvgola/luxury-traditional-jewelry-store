# Project Status

**Repository:** garvgola/luxury-traditional-jewelry-store  
**Current phase:** Phase 0 — Architecture audit and project foundation  
**Last updated:** 2026-11-21

## Phase 0 checklist

- [x] Confirm repository identity and retain existing repository name.
- [x] Establish project README and baseline engineering principles.
- [x] Create Phase 0 tracking issue.
- [ ] Inspect existing source tree and dependency manifests.
- [x] Draft system architecture.
- [x] Draft conceptual database schema.
- [x] Draft API contracts.
- [x] Define agent responsibilities and phase dependencies.
- [x] Draft integration guide.
- [x] Draft security standards.
- [ ] Owner review and approval of Phase 0 architecture.
- [ ] Establish development branch and CI baseline after repository workflow review.

## Current evidence and limitations

The repository was initially reported as empty. A README was subsequently found on `main` and updated. No application source code, package manifest, migrations, tests, or deployment configuration have yet been audited in this phase. The architecture documents are proposals, not evidence of implemented functionality.

## Blocking owner decisions

1. Confirm the store/brand name and final visual identity.
2. Confirm whether guest checkout is required.
3. Confirm product variant and stock-tracking model.
4. Confirm shipping provider and shipping rules.
5. Confirm returns, cancellation, exchange, and refund policies.
6. Confirm GST/tax and invoice requirements with a qualified accountant.
7. Confirm email/SMS provider and notification scope.
8. Confirm first-release scope for coupons, reviews, and stock alerts.

## Release controls

- No live Razorpay payments without explicit owner approval.
- No production deployment without QA sign-off and explicit owner approval.
- No real customer data or secrets in repository.
- Do not apply database migrations to a live project until reviewed and approved.

## Tracking

See [Phase 0 GitHub issue #1](https://github.com/garvgola/luxury-traditional-jewelry-store/issues/1).


## Owner decisions captured (2026-11-21)

- [x] Public browsing allowed without an account; registration/sign-in required to place an order.
- [x] No per-variant stock tracking in release one; demand-led procurement and manual availability updates by the owner.
- [x] Returns/refunds deferred to future scope; retain extensible order/payment records.
- [x] Shipping managed by the owner; no shipping-provider integration in release one.

## Updated first-release constraints

- No guest checkout.
- No automated stock reservation, decrement, or per-variant quantity ledger in release one. Use manually maintained availability/lead-time state and clearly communicate that fulfilment may be demand-led.
- No returns/refunds workflow in release one.
- No courier API integration in release one. Admin should support manual fulfilment/tracking updates if tracking details are provided by the owner.

## Remaining owner decisions before checkout implementation

1. How should shipping charges be calculated and displayed (fixed fee, free shipping, location-based, or confirmed manually before payment)?
2. What exact product availability labels should customers see (e.g. available to order, made to order, temporarily unavailable)?
3. What delivery estimate or lead-time wording should be displayed for demand-led procurement?


## Shipping and delivery decisions recorded (2026-11-21)

- [x] Shipping charge is location-based and managed through owner-configured rates/zones.
- [x] Display an estimated delivery window; it is indicative, not guaranteed.
- [x] Persist the applied shipping fee and estimate on the order so future configuration changes do not rewrite historical orders.

## Updated checkout requirements

- Checkout quote must calculate shipping from the delivery location on the server and display the complete payable total before payment.
- Owner-managed shipping configuration is required; courier/carrier API integration is not.
- Estimated delivery windows must be configurable and saved with the order.
