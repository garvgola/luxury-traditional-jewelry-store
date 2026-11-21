# Issue Register

Status reflects merged code and external configuration evidence as of 2026-11-21. Code merged does not equal runtime verified.

| ID | Priority | Issue / blocker | Owner | Status |
|---|---|---|---|---|
| REL-001 | Critical | No development Supabase project credentials; database-backed features are not runtime verified | Owner / Agent 3 | Blocked on Supabase connection |
| REL-002 | Critical | Migrations 00100–00700 and pgTAP have not been applied/executed | Agent 3 / Agent 7 | Pending |
| PAY-001 | Critical | Razorpay code is merged but merchant test keys, webhook setup and runtime verification are pending | Owner / Agent 5 / Agent 7 | Code merged; test setup pending |
| TAX-001 | Critical | GSTIN, seller state, place-of-supply, CGST/SGST vs IGST, freight tax and invoice requirements need confirmation | Owner / Accountant | Decision required |
| SEC-001 | High | RLS, admin authorization and storage policies need runtime tests with anonymous/customer/admin identities | Agent 4 / Agent 7 | Pending Supabase setup |
| SHIP-001 | High | Shipping zones/rates and quote endpoint need real postal-code testing | Owner / Agent 6 | Code merged; config pending |
| DEV-001 | High | Vercel team/project, environment variables, preview and production deployment not configured/verified | Owner / Agent 8 | Blocked on Vercel connection |
| DATA-001 | Medium | Real product catalogue, HSN/GST details and owner-approved jewellery photography not supplied | Owner | Pending owner content |
| ADM-001 | Medium | Refunds/cancellations, disputes and complete operational reporting remain incomplete | Agent 6 | Not implemented |
| OPS-001 | Medium | Transactional email provider/sender domain and order/fulfilment notifications not configured | Owner / Agent 6 | Pending provider setup |
| QA-001 | Medium | Playwright coverage is smoke-level; full checkout, security, accessibility and performance tests remain | Agent 7 | Partial |

## Resolution rule

Do not close an issue based only on code being merged. Require external configuration and test evidence named in the issue.
