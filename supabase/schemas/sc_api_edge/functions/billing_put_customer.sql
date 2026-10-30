CREATE OR REPLACE FUNCTION sc_api_edge.billing_put_customer (
  input_user_id            uuid,
  input_stripe_customer_id text
)
  RETURNS text
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
declare v_customer_id text;
begin
  insert into sc_app.customers (id, stripe_customer_id)
  values (input_user_id, input_stripe_customer_id)
  on conflict (id) do nothing;
  select c.stripe_customer_id into v_customer_id from sc_app.customers c where c.id = input_user_id;
  return v_customer_id;
end;
$function$;

GRANT EXECUTE ON FUNCTION "sc_api_edge"."billing_put_customer"(uuid, text) TO "postgres", "service_role";

REVOKE ALL ON FUNCTION "sc_api_edge"."billing_put_customer"(uuid, text) FROM PUBLIC;
