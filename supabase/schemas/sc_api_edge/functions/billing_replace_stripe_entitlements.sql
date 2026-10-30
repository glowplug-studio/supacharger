CREATE OR REPLACE FUNCTION sc_api_edge.billing_replace_stripe_entitlements (
  input_stripe_customer_id text,
  input_entitlements       jsonb
)
  RETURNS void
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
declare v_account_id uuid; v_entitlement jsonb;
begin
  select c.billing_account_id
  into v_account_id
  from sc_app.stripe_customer_mappings c
  where c.stripe_customer_id = input_stripe_customer_id;

  if v_account_id is null then
    raise exception 'Stripe customer mapping not found' using errcode = 'P0002';
  end if;

  update sc_app.entitlement_grants
  set active = false, updated_at = timezone('utc', now())
  where billing_account_id = v_account_id
    and source = 'stripe_entitlement';

  for v_entitlement in
    select value
    from jsonb_array_elements(coalesce(input_entitlements, '[]'::jsonb))
  loop
    insert into sc_app.billing_features (lookup_key, name)
    values (
      v_entitlement->>'lookup_key',
      coalesce(v_entitlement->>'lookup_key', '')
    )
    on conflict (lookup_key) do nothing;

    insert into sc_app.entitlement_grants (
      billing_account_id, feature_lookup_key, source, source_reference, active
    ) values (
      v_account_id,
      v_entitlement->>'lookup_key',
      'stripe_entitlement',
      v_entitlement->>'id',
      true
    )
    on conflict (
      billing_account_id, feature_lookup_key, source, (coalesce(source_reference, ''))
    )
    do update set active = true, updated_at = timezone('utc', now());
  end loop;
end;
$function$;

GRANT EXECUTE ON FUNCTION "sc_api_edge"."billing_replace_stripe_entitlements"(text, jsonb) TO "postgres", "service_role";

REVOKE ALL ON FUNCTION "sc_api_edge"."billing_replace_stripe_entitlements"(text, jsonb) FROM PUBLIC;
