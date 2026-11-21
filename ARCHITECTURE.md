# System Architecture (Phase 0 Draft)

**Status:** Draft — requires owner approval  
**Last updated:** 2026-11-21

## 1. Product scope

A premium traditional Indian jewellery storefront supporting product discovery, customer accounts, cart and wishlist, checkout, online payments, order tracking, and a protected administration area.

The first release should prioritize a secure, maintainable commerce core. Advanced recommendations, loyalty, multi-vendor capabilities, and complex marketing automation are out of scope until separately approved.

## 2. Proposed technology

- Web application: Next.js App Router, React, TypeScript
- Styling: Tailwind CSS with a shared design-token system
- Data and identity: Supabase (PostgreSQL, Auth, Storage)
- Payments: Razorpay, with server-side order creation and signature/webhook verification
- Hosting: Vercel
- Source control and review: GitHub

Versions and hosting tiers must be selected during implementation after compatibility and cost review. No secrets belong in the repository.

## 3. High-level components

1. Storefront: home, collections, category/product listing, product detail, search, editorial content.
2. Customer experience: sign-up/sign-in, profile, addresses, cart, wishlist, checkout, order history.
3. Commerce service layer: pricing validation, cart validation, inventory reservation, order lifecycle, payment orchestration.
4. Data platform: PostgreSQL tables, constraints, indexes, Row Level Security (RLS), and private storage policies.
5. Admin: role-protected product, inventory, collection, order, customer-support, and reporting workflows.
6. External services: Razorpay payment gateway and transactional email provider (provider to be selected).

## 4. Trust boundaries and request flow

- Browser requests are untrusted. The server revalidates identity, ownership, price, stock, and order state.
- Supabase RLS is defense in depth, not a replacement for server-side authorization.
- Privileged service-role credentials may be used only in trusted server environments and never exposed to the browser.
- Payment status is authoritative only after server-side verification and/or a verified Razorpay webhook.
- Webhook processing must be idempotent and tolerate retries and out-of-order delivery.

## 5. Core commerce invariants

- Store INR amounts as integer paise; never use floating-point arithmetic for money.
- Recalculate product price, discounts, tax, shipping, and payable amount on the server.
- A client-supplied total is informational and must never be trusted.
- Inventory reservation/decrement must be atomic and concurrency-safe.
- A successful payment must map to exactly one valid order/payment state transition.
- Use unique provider order/payment identifiers and idempotency keys where supported.
- Preserve an auditable order/payment event trail.

## 6. Suggested deployment topology

- Vercel hosts the Next.js application.
- Supabase hosts PostgreSQL, Auth, and product media storage.
- Razorpay handles payment collection; secrets and webhook secrets are configured in server-only environment variables.
- Separate development, preview/staging, and production configuration. Production data must not be copied into development casually.

## 7. Quality attributes

Security, accessibility, mobile responsiveness, SEO, observability, predictable failure handling, backup/recovery, and maintainable module boundaries are release requirements.

## 8. Open decisions for owner approval

- Brand/store name, logo, domain, and final visual identity.
- Product variants (e.g. size, finish, material), SKU policy, and inventory model.
- Shipping provider and shipping-rate rules.
- Tax/GST presentation and invoice requirements; confirm with a qualified accountant.
- Returns, cancellations, refunds, and exchange policy.
- Email/SMS provider and notification scope.
- Guest checkout versus mandatory account checkout.
- Whether product reviews, coupons, and stock alerts are in the first release.

## 9. Architecture gate

No feature implementation or production activation should proceed until the owner reviews this document and the linked database, API, integration, and security contracts.


## 10. Owner decisions recorded (2026-11-21)

- Guest visitors may browse all public storefront content. Registration/sign-in is required before placing an order or initiating checkout.
- Do not implement per-variant stock tracking in the first release. The business will procure stock based on demand and manage availability manually. The storefront should support an owner-managed product availability/lead-time status so customers are not promised immediately available stock without confirmation. A fuller inventory-management module may be added later.
- Returns, exchanges, and refunds are not part of the first-release operational workflow. Keep order/payment design extensible so these can be added in a later phase.
- Shipping will be managed by the owner. Do not integrate a shipping aggregator/provider in the first release. Allow the owner to manage shipping details/status manually and define how shipping charges are communicated before checkout implementation.


## 11. Shipping and delivery decisions recorded (2026-11-21)

- Shipping charges will be location-based. The checkout quote must calculate or retrieve the applicable charge using the customer's delivery location and show the final amount before order placement/payment. The owner will maintain the rate/zone rules; no shipping-carrier API integration is required in release one.
- Display an estimated delivery window to the customer. Estimates should be configurable and based on the owner's operational assumptions; do not promise a guaranteed date unless the owner explicitly confirms one. The admin should be able to adjust or override the estimate when needed.
