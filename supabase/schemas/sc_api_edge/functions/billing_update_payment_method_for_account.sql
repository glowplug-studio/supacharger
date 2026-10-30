CREATE OR REPLACE FUNCTION sc_api_edge.billing_update_payment_method_for_account (
  input_billing_account_id uuid,
  input_billing_address    jsonb,
  input_payment_method     jsonb
)
  RETURNS void
  LANGUAGE sql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
  update sc_app.stripe_customer_mappings
  set billing_address = input_billing_address,
      payment_method = input_payment_method,
      updated_at = timezone('utc', now())
  where billing_account_id = input_billing_account_id;
$function$;

GRANT EXECUTE ON FUNCTION "sc_api_edge"."billing_update_payment_method_for_account"(uuid, jsonb, jsonb) TO "postgres", "service_role";

REVOKE ALL ON FUNCTION "sc_api_edge"."billing_update_payment_method_for_account"(uuid, jsonb, jsonb) FROM PUBLIC;
