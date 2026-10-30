CREATE OR REPLACE FUNCTION sc_api_edge.billing_get_account_by_customer (
  input_stripe_customer_id text
)
  RETURNS uuid
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
  select c.billing_account_id
  from sc_app.stripe_customer_mappings c
  where c.stripe_customer_id = input_stripe_customer_id;
$function$;

GRANT EXECUTE ON FUNCTION "sc_api_edge"."billing_get_account_by_customer"(text) TO "postgres", "service_role";

REVOKE ALL ON FUNCTION "sc_api_edge"."billing_get_account_by_customer"(text) FROM PUBLIC;
