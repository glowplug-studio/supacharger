CREATE OR REPLACE FUNCTION sc_api_edge.billing_get_customer (
  input_user_id uuid
)
  RETURNS TABLE (
    stripe_customer_id text
  )
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
  select c.stripe_customer_id from sc_app.customers c where c.id = input_user_id;
$function$;

GRANT EXECUTE ON FUNCTION "sc_api_edge"."billing_get_customer"(uuid) TO "postgres", "service_role";

REVOKE ALL ON FUNCTION "sc_api_edge"."billing_get_customer"(uuid) FROM PUBLIC;
