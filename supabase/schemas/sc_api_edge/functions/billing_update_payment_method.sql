CREATE OR REPLACE FUNCTION sc_api_edge.billing_update_payment_method (
  input_user_id         uuid,
  input_billing_address jsonb,
  input_payment_method  jsonb
)
  RETURNS void
  LANGUAGE sql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
  update sc_app.customers set billing_address = input_billing_address, payment_method = input_payment_method
  where id = input_user_id;
$function$;

GRANT EXECUTE ON FUNCTION "sc_api_edge"."billing_update_payment_method"(uuid, jsonb, jsonb) TO "postgres", "service_role";

REVOKE ALL ON FUNCTION "sc_api_edge"."billing_update_payment_method"(uuid, jsonb, jsonb) FROM PUBLIC;
