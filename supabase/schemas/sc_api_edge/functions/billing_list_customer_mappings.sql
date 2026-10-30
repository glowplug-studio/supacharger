CREATE OR REPLACE FUNCTION sc_api_edge.billing_list_customer_mappings()
  RETURNS TABLE (
    billing_account_id uuid,
    stripe_customer_id text,
    livemode           boolean
  )
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
  select c.billing_account_id, c.stripe_customer_id, c.livemode
  from sc_app.stripe_customer_mappings c
  order by c.created_at;
$function$;

GRANT EXECUTE ON FUNCTION "sc_api_edge"."billing_list_customer_mappings"() TO "postgres", "service_role";

REVOKE ALL ON FUNCTION "sc_api_edge"."billing_list_customer_mappings"() FROM PUBLIC;
