# UI Component Catalog — Phase 1

**Owner:** Agent 1 — UI/UX and Design System  
**Consumers:** Agent 2 Frontend, Agent 6 Admin  
**Status:** Component specification, not yet implemented

## 1. Foundations
- Color tokens and semantic status tokens
- Typography scale
- Spacing scale
- Breakpoints and content containers
- Border, radius, shadow, and focus-ring tokens
- Icon sizing and accessible icon labels

## 2. Global shell
- SiteHeader
- DesktopNavigation
- MobileNavigationDrawer
- SearchTrigger / SearchPanel
- Breadcrumbs
- SiteFooter
- AnnouncementBar (optional; only approved factual messaging)

## 3. Catalogue
- ProductCard
- ProductGrid
- ProductGallery
- ProductPrice
- ProductAvailabilityBadge
- ProductVariantSelector
- CategoryTile
- CollectionBanner
- FilterDrawer / FilterSidebar
- SortControl
- SearchResultsSummary
- EmptySearchState

ProductAvailabilityBadge must represent owner-managed availability, never live stock quantity.

## 4. Customer and commerce
- AccountForm
- PasswordField
- AddressForm
- AddressCard
- WishlistButton
- CartLineItem
- CartSummary
- CheckoutProgress
- ShippingRateSummary
- EstimatedDeliveryNotice
- OrderSummary
- PaymentStatus
- OrderStatusTimeline

Checkout must require an authenticated customer. ShippingRateSummary displays the server-calculated location-based charge. EstimatedDeliveryNotice must state that dates are estimates.

## 5. Admin
- AdminShell
- AdminSidebar
- AdminDataTable
- ProductEditor
- AvailabilityEditor
- ShippingZoneEditor
- ShippingRateEditor
- DeliveryEstimateEditor
- OrderDetailPanel
- ManualFulfilmentEditor
- AuditEventList
- ConfirmActionDialog

Admin components must be protected by server-side authorization, not merely hidden in the UI.

## 6. Shared primitives
- Button (primary, secondary, tertiary, destructive)
- TextField
- Select
- TextArea
- Checkbox
- RadioGroup
- Dialog
- Drawer
- DropdownMenu
- Tabs
- Badge
- Skeleton
- Toast / InlineAlert
- Pagination
- Tooltip

## 7. Component contract

Every interactive component must define:
- Props and typed value shapes
- Keyboard and screen-reader behavior
- Loading/disabled/error states
- Responsive behavior
- Analytics events only where approved and privacy-reviewed
- Unit or interaction tests for meaningful behavior

## 8. Design review checklist

- Uses semantic design tokens, not arbitrary one-off colors.
- Works at 360 px and wide desktop.
- Keyboard accessible with visible focus.
- Has loading, empty, and error states where data-driven.
- Does not invent price, stock, review, certification, or delivery claims.
- Uses real product imagery and meaningful alt text.
- Does not expose admin actions to unauthorized users.
