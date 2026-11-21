# Issue Register

Status reflects repository evidence as of 2026-11-21. Priority is based on production risk, not effort.

| ID | Priority | Issue / blocker | Owner | Status |
|---|---|---|---|---|
| REL-001 | Critical | No Supabase project credentials; database-backed features are not runtime verified | Agent 3 / Agent 4 | Blocked on owner project setup |
| REL-002 | Critical | Database migrations and pgTAP tests have not been applied/executed against Supabase | Agent 3 / Agent 7 | Pending |
| PAY-001 | Critical | Razorpay integration code exists but test/live credentials, webhook setup and runtime verification are pending | Agent 5 / Agent 7 | Code in PR #19; external validation pending |
| PAY-002 | High | GST/tax and invoice treatment has not been approved by owner/accountant | Owner / Agent 5 | Decision required |
| SEC-001 | High | RLS, role authorization, storage policies and cross-customer isolation need runtime tests | Agent 4 / Agent 7 | Pending development Supabase |
| SHIP-001 | High | Shipping quote requires server-only service-role key and configured zones/rates | Agent 3 / Agent 6 | Code merged; environment pending |
| DATA-001 | Medium | Real product catalogue and owner-approved jewellery images have not been supplied | Owner / Agent 6 | Pending owner content |
| ADM-001 | Medium | Product variant/price editing, image ordering, image alt-text editing and refunds/cancellations are incomplete | Agent 6 | Partial; order fulfilment UI in PR #19 |
| OPS-001 | Medium | Refunds, returns, email notifications, coupons and review workflows are incomplete | Agent 5 / Agent 6 | Not implemented |
| QA-001 | Medium | Playwright coverage is smoke-level; full checkout, security, accessibility and performance suites are outstanding | Agent 7 | Partial |
| DEV-001 | High | Vercel project/domain/production deployment has not been configured or verified | Agent 8 | Not started |

| TAX-001 | Critical | GST registration/state, place of supply, CGST/SGST vs IGST, freight tax and invoice requirements need owner/accountant confirmation | Owner / Agent 5 | Decision required before live payments |

## Resolution rule

Do not close an issue based only on code being merged. Require the external configuration and test evidence named in the issue.
