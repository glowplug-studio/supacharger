CREATE OR REPLACE FUNCTION sc_api_edge.billing_upsert_subscription (
  input_subscription jsonb
)
  RETURNS void
  LANGUAGE sql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
  insert into sc_app.subscriptions (
    subscription_id, user_id, status, metadata, price_id, quantity, cancel_at_period_end,
    created, current_period_start, current_period_end, ended_at, cancel_at,
    canceled_at, trial_start, trial_end
  ) values (
    input_subscription->>'subscription_id', (input_subscription->>'user_id')::uuid,
    (input_subscription->>'status')::sc_app.subscription_status, input_subscription->'metadata',
    input_subscription->>'price_id', (input_subscription->>'quantity')::integer,
    (input_subscription->>'cancel_at_period_end')::boolean,
    (input_subscription->>'created')::timestamptz,
    (input_subscription->>'current_period_start')::timestamptz,
    (input_subscription->>'current_period_end')::timestamptz,
    (input_subscription->>'ended_at')::timestamptz, (input_subscription->>'cancel_at')::timestamptz,
    (input_subscription->>'canceled_at')::timestamptz,
    (input_subscription->>'trial_start')::timestamptz, (input_subscription->>'trial_end')::timestamptz
  ) on conflict (subscription_id) do update set user_id = excluded.user_id, status = excluded.status,
    metadata = excluded.metadata, price_id = excluded.price_id, quantity = excluded.quantity,
    cancel_at_period_end = excluded.cancel_at_period_end, created = excluded.created,
    current_period_start = excluded.current_period_start,
    current_period_end = excluded.current_period_end, ended_at = excluded.ended_at,
    cancel_at = excluded.cancel_at, canceled_at = excluded.canceled_at,
    trial_start = excluded.trial_start, trial_end = excluded.trial_end;
$function$;

GRANT EXECUTE ON FUNCTION "sc_api_edge"."billing_upsert_subscription"(jsonb) TO "postgres", "service_role";

REVOKE ALL ON FUNCTION "sc_api_edge"."billing_upsert_subscription"(jsonb) FROM PUBLIC;
