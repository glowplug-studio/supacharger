CREATE OR REPLACE FUNCTION sc_api_edge.billing_upsert_price (
  input_price jsonb
)
  RETURNS void
  LANGUAGE sql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
  insert into sc_app.prices (
    id, product_id, active, description, unit_amount, currency, type,
    interval, interval_count, trial_period_days, metadata
  ) values (
    input_price->>'id', input_price->>'product_id', (input_price->>'active')::boolean,
    input_price->>'description', (input_price->>'unit_amount')::bigint, input_price->>'currency',
    (input_price->>'type')::sc_app.pricing_type,
    nullif(input_price->>'interval', '')::sc_app.pricing_plan_interval,
    (input_price->>'interval_count')::integer, (input_price->>'trial_period_days')::integer,
    input_price->'metadata'
  ) on conflict (id) do update set product_id = excluded.product_id,
    active = excluded.active, description = excluded.description,
    unit_amount = excluded.unit_amount, currency = excluded.currency, type = excluded.type,
    interval = excluded.interval, interval_count = excluded.interval_count,
    trial_period_days = excluded.trial_period_days, metadata = excluded.metadata;
$function$;

GRANT EXECUTE ON FUNCTION "sc_api_edge"."billing_upsert_price"(jsonb) TO "postgres", "service_role";

REVOKE ALL ON FUNCTION "sc_api_edge"."billing_upsert_price"(jsonb) FROM PUBLIC;
