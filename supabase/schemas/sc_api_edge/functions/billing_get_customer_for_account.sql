CREATE OR REPLACE FUNCTION sc_api_edge.billing_get_customer_for_account (
  input_billing_account_id uuid,
  input_livemode           boolean DEFAULT NULL::boolean
)
  RETURNS TABLE (
    stripe_customer_id text,
    livemode           boolean
  )
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
  select c.stripe_customer_id, c.livemode
  from sc_app.stripe_customer_mappings c
  where c.billing_account_id = input_billing_account_id
    and (input_livemode is null or c.livemode = input_livemode or c.livemode is null)
  order by c.livemode nulls last
  limit 1;
$function$;

GRANT EXECUTE ON FUNCTION "sc_api_edge"."billing_get_customer_for_account"(uuid, boolean) TO "postgres", "service_role";

REVOKE ALL ON FUNCTION "sc_api_edge"."billing_get_customer_for_account"(uuid, boolean) FROM PUBLIC;
