# Database Schema Proposal (Phase 0 Draft)

**Status:** Conceptual proposal — not yet applied to Supabase  
**Currency:** INR, stored as integer paise

This document describes logical entities, not an executed migration. Final columns, constraints, indexes, retention, and RLS policies must be reviewed before implementation.

## 1. Identity and customer data

### profiles
- id (UUID, primary key; references auth.users)
- full_name, phone (nullable), created_at, updated_at

### customer_addresses
- id, user_id, recipient_name, phone
- address_line_1, address_line_2, locality, city, state, postal_code, country_code
- is_default, created_at, updated_at

Users may read/write only their own addresses. Validate address ownership during checkout.

### user_roles
- user_id, role, created_at
- Role values should be constrained (e.g. customer, admin). Role assignment must be restricted to trusted administrative workflows; users must not self-promote.

## 2. Catalogue

### categories
- id, name, slug, description, image_path, sort_order, is_active

### collections
- id, name, slug, description, banner_path, is_active, starts_at, ends_at

### products
- id, category_id, name, slug, description, status, is_featured, created_at, updated_at

### product_variants
- id, product_id, sku (unique), variant_label, attributes (validated JSONB), price_paise, compare_at_price_paise (nullable), currency, is_active

### product_media
- id, product_id, variant_id (nullable), storage_path, alt_text, sort_order

### collection_products
- collection_id, product_id, sort_order

Use integer non-negative constraints for paise values. Define whether inventory is tracked per product or per variant before migrations.

## 3. Inventory

### inventory
- id, variant_id (unique), quantity_on_hand, quantity_reserved, updated_at
- Enforce quantity_on_hand >= 0, quantity_reserved >= 0, and quantity_reserved <= quantity_on_hand if this representation is adopted.

### inventory_movements
- id, variant_id, movement_type, quantity_delta, reference_type, reference_id, reason, created_by, created_at

Inventory mutations should occur through a transaction-safe server/database function. Never rely on a read-then-write sequence from the browser.

## 4. Cart and saved items

### carts
- id, user_id (nullable for guest cart design), session_key (nullable), status, created_at, updated_at

### cart_items
- id, cart_id, variant_id, quantity, created_at, updated_at
- Unique cart/variant pair; validate quantity and availability server-side.

### wishlists
- id, user_id, created_at

### wishlist_items
- wishlist_id, product_id, created_at
- Unique wishlist/product pair.

Guest cart persistence and merge-on-login behavior require an explicit decision.

## 5. Orders and payments

### orders
- id, order_number (unique), user_id, status, currency
- subtotal_paise, discount_paise, tax_paise, shipping_paise, total_paise
- shipping_address_snapshot (JSONB), billing_address_snapshot (JSONB)
- placed_at, created_at, updated_at

Address snapshots preserve the address used for the transaction even if a customer later edits their profile.

### order_items
- id, order_id, product_id, variant_id, sku_snapshot, product_name_snapshot
- unit_price_paise, quantity, line_total_paise

### payments
- id, order_id, provider, provider_order_id, provider_payment_id
- amount_paise, currency, status, verified_at, created_at, updated_at
- Unique constraints for provider identifiers where appropriate.

### payment_events
- id, payment_id, provider_event_id (unique where available), event_type, payload_redacted, signature_verified, received_at, processed_at

Do not store card numbers, CVVs, UPI PINs, or other payment credentials.

### order_status_history
- id, order_id, from_status, to_status, actor_id, note, created_at

## 6. Operations and content

Potential later tables: coupons, coupon_redemptions, product_reviews, shipping_fulfilments, return_requests, refund_records, notification_jobs, audit_logs, site_content. Include only after first-release requirements are approved.

## 7. Data access and RLS baseline

- Public/anonymous: read only active catalogue data and published media.
- Authenticated customer: read/update own profile and addresses; read own carts, wishlist, and orders; create customer-owned records only through validated policies/services.
- Admin: access only through server-verified role checks and narrowly scoped policies.
- Payment, inventory, role, and order-state mutations: server-side trusted paths only.
- Never expose the Supabase service-role key to client bundles.

## 8. Migration and review requirements

Before implementation, convert this proposal into versioned SQL migrations; define foreign keys, deletion behavior, unique constraints, check constraints, indexes, RLS policies, and test cases. Confirm inventory reservation, guest checkout, GST, shipping, returns, and product-variant decisions with the owner.


## 9. Owner decisions recorded (2026-11-21)

- Account required for order placement: anonymous visitors can read public catalogue content, but cart checkout/order creation must require an authenticated customer. A guest cart may be omitted for the first release unless the owner later requests it.
- No per-variant stock tracking in the first release. Do not build quantity-on-hand/reserved stock tables or automatic stock decrement as a release-one dependency. Instead, support a simple owner-managed product/variant availability state or lead-time field (for example: available to order, made to order, temporarily unavailable) so demand-led procurement can be managed manually. The exact status vocabulary should be finalized with the admin UX.
- Keep inventory quantities and reservation/movement ledgers as future-scope schema options, not current implementation requirements.
- Returns/refunds are future scope. Preserve order and payment records so a future returns/refunds module can be added without redesigning core order identity; do not implement return-request tables or workflows in release one.
- Shipping is owner-managed. No shipping-provider integration is required for release one. Persist the customer's delivery address snapshot and allow the owner to record shipping/tracking details and update fulfilment status manually. Shipping charge rules remain an owner decision before checkout is implemented.


## 10. Shipping and delivery decisions recorded (2026-11-21)

- Shipping price is location-based and owner-managed. A simple configurable shipping-zone/rate model may be used (for example, postal-code ranges or service regions mapped to a fee); the exact rule format and rate table will be finalized during admin UX/backend design. The server must calculate the fee and include it in the checkout quote before payment.
- Persist the delivery address snapshot on the order. Persist the applied shipping charge in integer paise and, where useful, the shipping rule/zone identifier or a pricing snapshot so historical orders remain explainable if rates change.
- Store an estimated delivery window or estimated dispatch/delivery dates on the order as appropriate. Estimates must be treated as estimates, not guaranteed service-level commitments.
- Owner will manage carrier selection and shipment handling manually; no carrier integration is in first-release scope.
