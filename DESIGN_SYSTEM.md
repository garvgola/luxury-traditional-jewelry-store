# Design System — Phase 1

**Owner:** Agent 1 — UI/UX and Design System  
**Status:** First-release design specification  
**Architecture dependency:** Approved Phase 0 contracts  
**Date:** 2026-11-21

## 1. Experience principles

The storefront should feel like a premium Indian jewellery house: traditional in its visual references, contemporary in usability, restrained rather than ornate, and trustworthy at every commerce step.

Priorities:
1. Jewellery photography and product details lead the experience.
2. Clear product pricing, availability, delivery estimates, and shipping charges.
3. Mobile-first browsing and friction-conscious registration/checkout.
4. Consistent typography, spacing, interaction states, and accessible contrast.
5. Avoid visual clutter, excessive animation, fake urgency, and misleading stock claims.

## 2. Visual direction

### Palette

Use semantic tokens rather than hard-coded colors in components.

| Token | Hex | Intended use |
|---|---|---|
| Burgundy 900 | #3B101B | Primary brand surfaces, footer |
| Burgundy 800 | #541A2A | Primary actions, strong accents |
| Antique Gold 600 | #A98545 | Gold accent, borders, icon details |
| Champagne 100 | #F4EBDD | Soft section backgrounds |
| Ivory 50 | #FBF8F2 | Main page background |
| Earth 700 | #66584C | Secondary text |
| Ink 900 | #211D1A | Main text |
| Muted 600 | #756D65 | Supporting text |
| Line 200 | #E6DED2 | Dividers and borders |
| Success 700 | #286348 | Success feedback |
| Warning 700 | #8A5A16 | Caution feedback |
| Danger 700 | #A33333 | Errors and destructive actions |

Gold is an accent, not a body-text color on light backgrounds unless contrast is verified. Maintain readable contrast for every text/background pairing.

### Typography

- Display/headings: elegant serif family (proposed: Cormorant Garamond or a licensed/available equivalent).
- Body/UI: neutral sans-serif (proposed: Inter or equivalent).
- Use serif typography for editorial headlines and selected product storytelling, not dense controls.
- Use tabular numerals for prices, quantities, and order identifiers where supported.
- Avoid all-caps for long labels.

### Shape, borders, and depth

- Cards: subtle 2–4 px corner radius for a refined editorial feel; avoid excessive pill shapes.
- Buttons: modest radius, clear hover/focus states.
- Borders: warm neutral hairlines.
- Shadows: restrained and functional, primarily for menus, dialogs, and sticky surfaces.
- Gold outlines should be used sparingly.

## 3. Layout and spacing

Use a consistent 4 px base spacing scale. Suggested spacing steps: 4, 8, 12, 16, 24, 32, 48, 64, 80 px.

- Content max width: approximately 1280 px.
- Desktop page gutters: 40–56 px.
- Tablet gutters: 24–32 px.
- Mobile gutters: 16–20 px.
- Product listing: 4 columns on wide desktop, 3 on compact desktop, 2 on mobile.
- Product detail: two-column media/details layout on desktop; stacked layout on mobile.
- Keep text measure comfortable; long descriptions should not span the full viewport.

## 4. Responsive breakpoints

Proposed breakpoints (adjust to framework conventions during implementation):
- Small mobile: below 480 px
- Mobile/tablet: 480–767 px
- Tablet/small desktop: 768–1023 px
- Desktop: 1024–1279 px
- Wide desktop: 1280 px and above

Every page must be tested at 360 px, 390 px, 768 px, 1024 px, and 1440 px widths.

## 5. Imagery and product presentation

- Prioritize original, high-resolution product photography with consistent lighting and background treatment.
- Use multiple product angles where available; include close-ups for craftsmanship and details.
- Never stretch product images or crop out key jewellery details.
- Use consistent aspect ratios within a product grid.
- Provide meaningful alt text describing the item, not keyword stuffing.
- If an image is unavailable, use a neutral branded placeholder; do not use unrelated stock imagery.
- Confirm image rights and compression before production.

## 6. Interaction patterns

### Buttons
- Primary: burgundy fill, ivory text.
- Secondary: ivory/transparent fill with burgundy border/text.
- Tertiary: text action with visible focus state.
- Destructive: danger semantic token and confirmation for irreversible actions.

### Forms
- Persistent visible labels; placeholders are examples, not labels.
- Inline validation after interaction and on submit.
- Explain password requirements before submission.
- Provide show/hide password control.
- Preserve entered values after recoverable errors.
- Use appropriate input types and autocomplete attributes.

### Feedback states
All data-driven components need loading, empty, error, success, and disabled states where applicable. Provide actionable error messages and avoid exposing internal errors.

### Accessibility
- Target WCAG 2.2 AA.
- Full keyboard operation and visible focus indicators.
- Semantic headings and landmarks.
- Dialog focus management and escape behavior.
- Do not convey status by color alone.
- Respect reduced-motion preferences.
- Accessible names for icon-only controls.

## 7. Motion

Motion should be subtle and purposeful:
- Short transitions for hover/focus and disclosure.
- Avoid auto-playing carousels and motion that delays access to content.
- Respect prefers-reduced-motion.
- Do not use animation to imply fake stock scarcity or urgency.

## 8. Commerce-specific UX rules

- Visitors can browse public content without an account.
- Registration/sign-in is required before order placement. Preserve the intended cart state through authentication where feasible.
- Display product availability using owner-managed states, not fabricated stock counts.
- Show location-based shipping charge and estimated delivery window before payment.
- Delivery estimates are indicative, not guaranteed.
- Returns/refunds are not offered as a first-release workflow; do not display a returns promise until the policy is approved.
- Do not display unsupported trust badges, certifications, hallmark claims, or material purity claims without verified business evidence.

## 9. Brand content and trust

Use a calm, confident, craftsmanship-led tone. Product descriptions should state only verified materials, dimensions, finish, care instructions, and inclusions. Avoid claims such as certified, pure, hypoallergenic, or guaranteed unless the owner provides evidence.

## 10. Implementation handoff

Agent 2 should translate these tokens into CSS variables/design tokens and reusable components. Agent 1 should review screenshots and responsive behavior before Phase 1 is marked complete. Exact font licensing, final logo, photography, and store name remain owner inputs.


## 11. Brand identity decisions (owner-confirmed 2026-11-21)

- Store/brand name: **NAMO NAMO jewels**. Preserve this exact spelling and capitalization in brand references unless the owner supplies an official lockup with a different typographic treatment.
- Primary visual direction: **Heritage fusion** — traditional Indian jewellery cues and craftsmanship-led storytelling combined with contemporary luxury layouts and restrained interface patterns.
- Logo: a generated cream-background logo concept has been selected by the owner as the current primary brand direction. It features an antique-gold Mughal-inspired arch/lotus emblem, ruby-red gemstone accent, and the “NAMO NAMO jewels” wordmark. Treat the cream/ivory background version as primary; the earlier burgundy-background version is not the primary logo. The generated raster artwork is a visual concept, not a production-ready vector master. Before production, prepare/verify a clean transparent or vector lockup and small-size mark without changing the approved design direction.

### Refined visual expression

- Keep the established deep burgundy, antique gold, ivory, champagne beige, and muted earthy palette.
- Use traditional motifs (e.g. jaali geometry, subtle floral/arch references, heritage-inspired borders) sparingly as supporting details, not as dense background decoration.
- Pair editorial serif headlines with modern sans-serif navigation, forms, and product metadata.
- Product imagery remains the hero. Use generous whitespace, clear hierarchy, restrained ornament, and contemporary grid systems.
- The overall impression should be rooted in Indian heritage but polished, readable, and current—not a wedding invitation or heavily ornamental template.

### Approved logo direction and asset requirements

- Primary lockup: cream/ivory background with antique-gold emblem and wordmark, plus the ruby-red gemstone accent.
- The burgundy-background version is not the selected primary logo.
- Keep the approved logo artwork intact when placing it in mockups; preserve aspect ratio and clear space.
- The current generated artwork is a raster concept. Before production use, create or commission a clean vector master and transparent-background variant while preserving the approved visual design.
- Create compact header/favicon variants as separate responsive brand assets; do not simply shrink the detailed lockup until it becomes illegible.
- Do not claim that vector, transparent, or small-size variants already exist until they are actually produced and reviewed.
