# Production checkout and Razorpay setup

## Implemented application flow

1. A signed-in customer chooses one of their own saved addresses.
2. The server reads the customer's cart and authoritative product variant prices.
3. The server validates product publication/availability, HSN and GST settings, and a shipping zone/rate.
4. A database function atomically snapshots the address, products, quantities, price, tax and shipping into a pending-payment order.
5. A unique customer idempotency key prevents duplicate local orders on retries.
6. A short-lived database claim prevents concurrent Razorpay order creation for the same local order.
7. The server creates the Razorpay order using secret-key authentication and returns only the public key ID and provider order details to the browser.
8. Razorpay Checkout handles payment details; card/UPI data never passes through this application.
9. The browser callback is not trusted by itself. The server validates the HMAC signature and retrieves the payment from Razorpay, checking provider order ID, amount, currency and captured status.
10. A signed Razorpay webhook independently reconciles captured/failed events. Event IDs are unique; captured payment/order state is idempotent.
11. A verified capture marks the order paid, writes order status history, and removes only the purchased quantities from the cart.

## Required environment

Configure in the hosting provider's encrypted environment-variable settings:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (or supported anon-key fallback)
- `SUPABASE_SERVICE_ROLE_KEY` (server-only)
- `RAZORPAY_KEY_ID`
- `RAZORPAY_KEY_SECRET` (server-only)
- `RAZORPAY_WEBHOOK_SECRET` (server-only)

Never expose the service-role key, Razorpay secret or webhook secret to browser bundles or source control.

## Supabase migration order

Apply all migrations to a disposable development project first:

1. `20261121000100_backend_foundation.sql`
2. `20261121000200_default_customer_address.sql`
3. `20261121000300_admin_product_creation.sql`
4. `20261121000400_product_media_storage.sql`
5. `20261121000500_seed_store_categories.sql`
6. `20261121000600_production_checkout_payments.sql`

Then run `supabase test db`. The checkout/payment migration is code in the repository; it has not been applied to a live Supabase project in this work session.

## Configure tax before taking payment

Tax is intentionally not guessed by the application. Every sellable product variant must have:
- HSN code.
- Applicable GST rate (basis points).
- Whether the displayed/listed price includes GST or GST is added.

The owner/accountant must verify the HSN and applicable tax treatment for each product. Existing products created before migration 006 must be updated in Admin → Products. Checkout refuses to create a payable order when any cart item lacks tax classification.

**Still requires accountant/owner confirmation before production:** seller GST registration details and state, place-of-supply treatment, CGST/SGST versus IGST split, shipping/freight tax treatment, invoice numbering/format, GST-inclusive pricing policy and applicable legal disclosures. The current order snapshot stores product-level GST totals; it is not a legally reviewed GST invoice engine.

## Razorpay dashboard configuration

1. Start with Razorpay **Test Mode** keys only.
2. Configure the webhook URL as `https://YOUR_DOMAIN/api/webhooks/razorpay`.
3. Set the webhook secret in the host environment as `RAZORPAY_WEBHOOK_SECRET`.
4. Subscribe to `payment.captured`, `payment.failed` and (if desired) `order.paid`.
5. Ensure capture is enabled according to the merchant's intended payment-capture workflow.
6. Test successful payment, failed payment, modal dismissal, duplicate webhook, delayed webhook, amount mismatch and signature mismatch.
7. Verify order and payment records in Supabase before moving to live keys.

Do not enable live keys or production payments until the owner approves the merchant account, tax/invoice rules, cancellation/refund terms and end-to-end test results.

## Important operational limits

- This does not implement refunds, partial refunds, chargebacks/disputes, cancellations after payment, or payment reconciliation dashboard.
- Email/SMS order notifications are not yet implemented.
- Order fulfilment/status transitions are not yet implemented.
- GST split and final tax invoice generation are not yet approved/implemented.
- The webhook route must be reachable publicly over HTTPS and configured in Razorpay.
- The development Supabase database, migrations, RLS and storage policies still need runtime verification.
