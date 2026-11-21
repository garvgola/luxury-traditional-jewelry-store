# Page and User-Flow Specifications — Phase 1

**Owner:** Agent 1 — UI/UX and Design System  
**Status:** First-release UX blueprint  
**Date:** 2026-11-21

## 1. Information architecture

### Public storefront
- Home
- Shop / All jewellery
- Category listing
- Collection landing
- Product detail
- Search results
- About the brand
- Contact
- FAQ / care information
- Privacy policy, terms, and shipping policy pages (final legal copy supplied/reviewed by owner)

### Customer account
- Register
- Sign in
- Password recovery
- Profile
- Saved addresses
- Wishlist
- Cart
- Checkout
- Order confirmation
- Order history
- Order detail

### Admin (protected)
- Admin sign-in/access gate
- Overview
- Products and categories
- Product availability/lead-time management
- Location-based shipping zones/rates
- Orders
- Manual fulfilment and tracking notes
- Basic customer support/order lookup

Returns/refunds screens are future scope and should not appear as active first-release features.

## 2. Global navigation

Desktop:
- Utility strip (optional, owner-approved messaging only)
- Brand header with logo, primary navigation, search, account, wishlist, cart
- Breadcrumbs on catalogue/product pages
- Footer with customer care, brand information, and policy links

Mobile:
- Compact header with menu, logo, search, and cart access
- Navigation drawer with clear focus and close behavior
- Persistent cart access without obscuring content
- Avoid overloading the header with too many icons

## 3. Home page

Recommended sections:
1. Editorial hero with one clear campaign message and primary shop action.
2. Featured categories.
3. Curated collection / new arrivals.
4. Brand craftsmanship/story section.
5. Featured products.
6. Care or styling editorial.
7. Newsletter sign-up only if an email consent and provider workflow are approved.
8. Footer.

Do not use invented sale countdowns, review counts, customer numbers, or stock scarcity.

## 4. Catalogue and search

- Product grid with consistent image ratio, title, price, and owner-managed availability label.
- Filters only for attributes supported by actual catalogue data.
- Sort by relevance/newest/price only where the data supports it.
- Search should provide a useful no-results state and clear filter reset.
- Pagination or load-more behavior must preserve filter state.
- Do not expose internal stock quantities.

## 5. Product detail

- Image gallery with accessible thumbnails and zoom behavior.
- Product name, price, description, verified material/finish details, availability state, estimated delivery guidance, and care details where available.
- Variant selection only for real purchasable options (e.g. size or finish); variant selection must not imply per-variant stock tracking.
- Add-to-cart action.
- Clear message that account registration/sign-in is required to place an order.
- Related products only when meaningful catalogue data exists.

## 6. Registration and sign-in

- Allow visitors to browse before account creation.
- When an unauthenticated visitor attempts to proceed to order placement, explain that an account is required and offer register/sign-in.
- Preserve cart contents during authentication when technically safe.
- After successful authentication, return the customer to the intended checkout step.
- Provide validation, password visibility, recovery, and clear success/error states.

## 7. Cart and checkout

Cart:
- Item image, product/variant selection, quantity, price, remove/save action.
- Revalidate current product price and owner-managed availability at checkout.
- Explain if an item is no longer available to order.

Checkout:
1. Authenticated customer details.
2. Delivery address selection/addition.
3. Server-calculated location-based shipping charge.
4. Estimated delivery window.
5. Order summary with all charges and final payable amount.
6. Payment.
7. Confirmation.

The customer must see the shipping charge and final total before initiating payment. Estimates must be clearly described as indicative, not guaranteed. Shipping rates and estimates are owner-managed; no carrier API integration is planned for release one.

## 8. Order confirmation and account

- Show order number, purchased items, address summary, paid/pending payment state, shipping charge, and estimated delivery window.
- Order history and detail pages show current order/fulfilment status.
- Do not show return/refund actions in first release.
- Provide a customer-care route for questions.

## 9. Admin UX

- Strong role-protected access; no admin links for customers.
- Product editor should manage title, descriptions, images, category, price, variant attributes, and availability state.
- Availability options should be configurable and owner-controlled (initial examples: available to order, made to order, temporarily unavailable).
- Shipping management should support owner-maintained service regions/postal-code rules, fees, and delivery estimates. The exact rate schema needs a separate implementation decision.
- Orders screen should support search/filter, status updates, and manual shipment/tracking notes.
- Sensitive changes should be confirmed and audit logged.
- Dashboard metrics must be based on real order data; do not display fabricated KPIs.

## 10. Required states

For each page/module specify:
- Loading
- Empty
- Error/retry
- Success
- Validation
- Disabled/unavailable
- Permission denied (protected areas)

## 11. Owner inputs still needed

- Final brand/store name and logo.
- Approved product categories and product attribute vocabulary.
- Real product photography and verified product specifications.
- Exact availability labels and lead-time rules.
- Shipping service regions/postal-code coverage, fee rules, and estimated delivery ranges.
- Customer-care contact details and final policy/legal copy.
- Whether coupon codes, product reviews, and newsletter signup belong in release one.
