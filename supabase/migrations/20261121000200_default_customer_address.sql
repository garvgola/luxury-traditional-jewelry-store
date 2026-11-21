-- Atomic default-address switch for a signed-in customer.
create or replace function public.set_default_customer_address(p_address_id uuid)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
begin
  if current_user_id is null then
    raise exception 'Authentication required';
  end if;

  update public.customer_addresses
  set is_default = false
  where user_id = current_user_id and is_default;

  update public.customer_addresses
  set is_default = true
  where id = p_address_id and user_id = current_user_id;

  if not found then
    raise exception 'Address not found';
  end if;
end;
$$;

revoke all on function public.set_default_customer_address(uuid) from public;
grant execute on function public.set_default_customer_address(uuid) to authenticated;
