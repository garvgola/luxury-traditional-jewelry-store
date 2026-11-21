# Administrator bootstrap

The admin interface is protected by a server-side Supabase role check and database RLS. There is no public admin registration or self-service role promotion.

## Grant the owner account administrator access

1. Create the owner account through the normal customer sign-up flow in the development storefront.
2. Confirm the owner's email in Supabase Auth.
3. In the Supabase SQL editor for the **development project only**, run the following after replacing the email with the exact owner account email:

```sql
insert into public.user_roles (user_id, role)
select id, 'admin'::public.app_role
from auth.users
where lower(email) = lower('OWNER_EMAIL')
on conflict (user_id, role) do nothing;
```

4. Sign out and sign back in so the new role is reflected in the session.
5. Open `/admin`.

Do not grant the role to an unverified or shared account. Keep the service-role key out of the browser and repository.

## Admin capabilities currently implemented

- Overview metrics for products, orders, registered customers and paid order value.
- Product creation with one initial variant and owner-managed availability.
- Availability changes and product archival.
- Read-only recent order list.

Product creation uses the atomic `admin_create_product` database function. Apply migration `20261121000300_admin_product_creation.sql` to the development project before using that workflow.

## Not yet implemented

Product image upload, category/collection management, editable pricing/variant management, order fulfilment updates, refunds, customer support workflows and admin audit-log UI. Payment state must remain controlled by verified server-side payment events, not edited manually in the dashboard.
