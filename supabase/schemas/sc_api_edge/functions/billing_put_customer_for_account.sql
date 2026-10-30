CREATE OR REPLACE FUNCTION sc_api_edge.billing_put_customer_for_account (
  input_billing_account_id uuid,
  input_stripe_customer_id text,
  input_livemode           boolean,
  input_stripe_account_id  text    DEFAULT 'platform'::text
)
  RETURNS text
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
declare v_customer_id text;
begin
  insert into sc_app.stripe_customer_mappings (
    billing_account_id, stripe_customer_id, stripe_account_id, livemode
  ) values (
    input_billing_account_id, input_stripe_customer_id, input_stripe_account_id, input_livemode
  )
  on conflict (billing_account_id, stripe_account_id, livemode)
  do update set stripe_customer_id = excluded.stripe_customer_id,
    updated_at = timezone('utc', now())
  returning stripe_customer_id into v_customer_id;
  return v_customer_id;
end;
$function$;

GRANT EXECUTE ON FUNCTION "sc_api_edge"."billing_put_customer_for_account"(uuid, text, boolean, text) TO "postgres", "service_role";

REVOKE ALL ON FUNCTION "sc_api_edge"."billing_put_customer_for_account"(uuid, text, boolean, text) FROM PUBLIC;
