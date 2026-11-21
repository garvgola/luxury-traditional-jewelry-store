# Deployment Plan

**Current state:** Not deployed. No verified production URL exists.

## Release gates before deployment

1. Configure a disposable development Supabase project.
2. Apply migrations 00100–00500 in order and execute pgTAP tests.
3. Verify authentication, customer RLS isolation, admin authorization, cart, wishlist, addresses, media access and shipping quotes.
4. Enter owner-approved product catalogue data and photography.
5. Confirm GST/tax and invoice treatment with the owner/accountant.
6. Implement and test Razorpay test-mode order creation, payment verification and idempotent webhooks.
7. Complete checkout, order confirmation, email and admin fulfilment workflows.
8. Complete security, accessibility, performance and end-to-end QA.
9. Obtain explicit owner approval for production payments and deployment.

## Vercel deployment sequence

1. Import the existing GitHub repository into Vercel.
2. Select `develop` for preview deployments; protect `main` for production.
3. Set the production framework to Next.js and use the repository's standard build command.
4. Configure environment variables for each environment separately.
5. Deploy a preview first and run the complete smoke/E2E suite.
6. Configure the production domain and HTTPS only after preview acceptance.
7. Verify auth redirects, storage signed URLs, server-side shipping quote, checkout, payment webhooks and admin role access.
8. Record the deployment URL, commit SHA, environment and QA sign-off.

## Environment variables

| Variable | Scope | Status |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Public | Required; not configured here |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Public | Required; not configured here |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public fallback | Optional legacy fallback |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only | Required for shipping quote RPC; not configured here |
| Razorpay keys/webhook secret | Server only | Not implemented/configured |
| Tax policy | Server/database | Owner/accountant decision required |

Never expose the Supabase service-role key or Razorpay secret to browser code. Never commit environment files.

## Rollback and recovery

- Keep `main` as the stable release branch.
- Deploy from a reviewed commit and retain the previous Vercel deployment for rollback.
- Back up Supabase before production migrations.
- Do not run destructive migrations without a tested backup/restore procedure.
- Revert application code separately from database changes; database rollback requires a migration-specific recovery plan.
