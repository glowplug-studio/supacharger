begin;

-- The exposed-argument rename replaced every occurrence of feature_lookup_key
-- in this routine's definition, including the qualified entitlement column.
-- Restore the column reference while retaining the canonical RPC argument.
create or replace function api.has_billing_access_by_current_user(
  input_feature_lookup_key text default null
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select case when $1 is null then exists (
    select 1
    from app.billing_account_members as member
    join app.subscriptions as subscription
      on subscription.billing_account_id = member.billing_account_id
    where member.user_id = (select auth.uid())
      and subscription.status in ('trialing', 'active')
  ) else exists (
    select 1
    from app.billing_account_members as member
    join app.entitlement_grants as entitlement
      on entitlement.billing_account_id = member.billing_account_id
    where member.user_id = (select auth.uid())
      and entitlement.feature_lookup_key = $1
      and entitlement.active is true
      and (entitlement.starts_at is null or entitlement.starts_at <= timezone('utc', now()))
      and (entitlement.ends_at is null or entitlement.ends_at > timezone('utc', now()))
  ) end;
$$;

revoke all on function api.has_billing_access_by_current_user(text)
from public, anon, service_role;
grant execute on function api.has_billing_access_by_current_user(text)
to authenticated;

comment on function api.has_billing_access_by_current_user(text) is
  'Returns whether the current authenticated user has active billing access, optionally scoped to a stable feature lookup key.';

notify pgrst, 'reload schema';

commit;
