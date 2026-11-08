CREATE OR REPLACE FUNCTION sc_api_edge.billing_read_stripe_data_pipeline (
  input_schema       text,
  input_livemode     boolean,
  input_customer_ids text[]
)
  RETURNS jsonb
  LANGUAGE plpgsql
  STABLE
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
declare
  v_products      jsonb;
  v_prices        jsonb;
  v_subscriptions jsonb;
begin
  if input_schema !~ '^stripe_sdp(?:_[a-z0-9_]+)?$' or length(input_schema) > 63 then
    raise exception 'Invalid Stripe Data Pipeline schema' using errcode = '22023';
  end if;

  if to_regclass(format('%I.products', input_schema)) is null
    or to_regclass(format('%I.prices', input_schema)) is null
    or to_regclass(format('%I.subscriptions', input_schema)) is null then
    raise exception 'Stripe Data Pipeline schema is missing products, prices, or subscriptions'
      using errcode = '42P01';
  end if;

  execute format(
    'select coalesce(jsonb_agg(_raw_data order by id), ''[]''::jsonb) from %I.products where livemode = $1',
    input_schema
  ) into v_products using input_livemode;

  execute format(
    'select coalesce(jsonb_agg(_raw_data order by id), ''[]''::jsonb) from %I.prices where livemode = $1',
    input_schema
  ) into v_prices using input_livemode;

  execute format(
    'select coalesce(jsonb_agg(_raw_data order by id), ''[]''::jsonb) from %I.subscriptions where livemode = $1 and customer = any($2)',
    input_schema
  ) into v_subscriptions using input_livemode, input_customer_ids;

  return jsonb_build_object(
    'products', v_products,
    'prices', v_prices,
    'subscriptions', v_subscriptions
  );
end;
$function$;

GRANT EXECUTE ON FUNCTION "sc_api_edge"."billing_read_stripe_data_pipeline"(text, boolean, text[]) TO "postgres", "service_role";

REVOKE ALL ON FUNCTION "sc_api_edge"."billing_read_stripe_data_pipeline"(text, boolean, text[]) FROM PUBLIC;
