CREATE OR REPLACE FUNCTION sc_api.has_billing_access_by_current_user (
  input_feature_lookup_key text DEFAULT NULL::text
)
  RETURNS boolean
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
  select case when $1 is null then exists (
    select 1
    from sc_app.billing_account_members as member
    join sc_app.subscriptions as subscription
      on subscription.billing_account_id = member.billing_account_id
    where member.user_id = (select auth.uid())
      and subscription.status in ('trialing', 'active')
  ) else exists (
    select 1
    from sc_app.billing_account_members as member
    join sc_app.entitlement_grants as entitlement
      on entitlement.billing_account_id = member.billing_account_id
    where member.user_id = (select auth.uid())
      and entitlement.feature_lookup_key = $1
      and entitlement.active is true
      and (entitlement.starts_at is null or entitlement.starts_at <= timezone('utc', now()))
      and (entitlement.ends_at is null or entitlement.ends_at > timezone('utc', now()))
  ) end;
$function$;

GRANT EXECUTE ON FUNCTION "sc_api"."has_billing_access_by_current_user"(text) TO "authenticated", "postgres";

COMMENT ON FUNCTION "sc_api"."has_billing_access_by_current_user"(text) IS 'Returns whether the current authenticated user has active billing access, optionally scoped to a stable feature lookup key.';

REVOKE ALL ON FUNCTION "sc_api"."has_billing_access_by_current_user"(text) FROM PUBLIC;
