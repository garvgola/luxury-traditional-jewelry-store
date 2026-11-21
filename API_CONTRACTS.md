# API Contracts (Phase 0 Draft)

**Status:** Proposed contract — endpoints are not implemented.

All endpoints use HTTPS in deployed environments, JSON request/response bodies unless specified, server-side validation, and consistent error envelopes.

## 1. Conventions

- Next.js route handlers under `/api/v1` are the proposed boundary.
- Authentication uses the configured Supabase Auth session; authorization is checked server-side.
- IDs are opaque UUIDs unless a human-readable order number is explicitly intended.
- Money is represented as integer paise with an ISO currency code (initially INR).
- Never accept client totals as authoritative.
- Apply rate limits to authentication-adjacent, checkout, coupon, and payment endpoints.
- Validate request bodies with shared schemas and reject unknown/invalid fields.

## 2. Proposed endpoints

| Method | Path | Purpose | Access |
|---|---|---|---|
| GET | /api/v1/products | Browse active products; filters and pagination | Public |
| GET | /api/v1/products/:slug | Product details and active variants | Public |
| GET | /api/v1/categories | Active categories | Public |
| GET | /api/v1/me | Current customer profile | Customer |
| PATCH | /api/v1/me | Update allowed profile fields | Customer |
| GET/POST | /api/v1/cart | Read or update cart | Customer/guest policy TBD |
| GET/POST/DELETE | /api/v1/wishlist | Manage saved products | Customer |
| POST | /api/v1/checkout/quote | Recalculate totals and validate stock | Customer/guest policy TBD |
| POST | /api/v1/orders | Create pending order and reserve stock | Customer/guest policy TBD |
| POST | /api/v1/payments/razorpay/order | Create provider order for a pending order | Customer |
| POST | /api/v1/payments/razorpay/verify | Verify checkout payment signature | Customer |
| POST | /api/v1/webhooks/razorpay | Receive verified provider events | Provider |
| GET | /api/v1/orders | List current customer's orders | Customer |
| GET | /api/v1/orders/:orderNumber | Read own order | Customer |
| GET/POST/PATCH | /api/v1/admin/products | Admin product operations | Admin |
| GET/PATCH | /api/v1/admin/orders | Admin order operations | Admin |
| GET/PATCH | /api/v1/admin/inventory | Admin inventory operations | Admin |

The table is a contract proposal. Route shapes may change after the architecture review.

## 3. Standard response shape

Success responses should return a stable resource object and, for lists, pagination metadata. Errors should use a consistent structure such as:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "The request could not be validated.",
    "requestId": "server-generated-correlation-id"
  }
}
```

Do not return stack traces, SQL errors, secrets, or internal provider payloads to clients.

## 4. Checkout and payment sequence

1. Client requests a checkout quote.
2. Server loads current catalogue prices and stock, validates quantities, shipping, tax, and discounts.
3. Server creates a pending order and reserves inventory atomically.
4. Server creates a Razorpay order using the server-calculated amount.
5. Client completes provider checkout using public checkout configuration.
6. Server verifies the Razorpay signature; webhook signature verification independently validates provider events.
7. Idempotent transaction updates payment/order state and inventory.
8. Failure, expiry, or cancellation releases reservation according to a documented timeout policy.

Exact order/payment state transitions and reservation expiry need to be finalized before coding.

## 5. HTTP status guidance

- 200: successful read/update
- 201: resource created
- 400: malformed request
- 401: unauthenticated
- 403: authenticated but unauthorized
- 404: resource not found or not visible to caller
- 409: state conflict, duplicate action, or stock conflict
- 422: semantically invalid input
- 429: rate limit exceeded
- 500: unexpected server error

## 6. Webhook requirements

Verify the signature against the raw request body and configured webhook secret before processing. Persist provider event identifiers, enforce idempotency, redact sensitive payload fields, and return provider-appropriate acknowledgements. Never mark an order paid based solely on a browser redirect or client callback.

## 7. Contract test requirements

Every route requires schema tests, authentication/authorization tests, ownership tests, validation tests, failure-path tests, and integration tests for database/payment side effects.


## 8. Owner decisions recorded (2026-11-21)

- Public catalogue endpoints are available without authentication. Cart checkout and order creation require an authenticated customer; unauthenticated order attempts return 401 and the UI directs the visitor to register/sign in.
- Remove guest checkout from release-one scope. A persistent guest cart is optional and should not be implemented unless separately approved.
- Do not expose stock quantity or implement automatic inventory reservation/decrement in release one. Product/variant availability is maintained manually by the owner and may be surfaced through a simple availability/lead-time field. The server must prevent ordering items explicitly marked unavailable.
- Returns/refunds endpoints are future scope and must not be presented as available in the first release.
- Shipping-provider integrations are out of scope. Admin/owner workflows may record courier name, tracking reference, dispatch date, and fulfilment status manually. Final shipping charges must be shown before order placement; the pricing rule needs owner confirmation.


## 9. Shipping and delivery contract decisions (2026-11-21)

- Checkout quote must accept the selected delivery address/location and return the server-calculated location-based shipping fee in integer paise, together with subtotal, tax/discount fields where applicable, total, currency, and an estimated delivery window.
- The shipping fee and estimate must be persisted as part of the order snapshot so later rate changes do not alter existing orders.
- Shipping rates/regions and delivery estimate rules are owner-managed configuration. Do not trust a shipping fee or delivery estimate supplied by the client.
- No courier booking, label generation, live tracking, or carrier API integration is required for release one. Admin may record shipment/tracking details manually if the owner wants them.
- Estimated delivery wording must make clear that the window is indicative and can vary; do not represent it as guaranteed.
