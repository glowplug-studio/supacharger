CREATE OR REPLACE FUNCTION sc_api_edge.billing_upsert_subscription_v2 (
  input_subscription jsonb,
  input_items        jsonb
)
  RETURNS void
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
declare v_item jsonb;
begin
  insert into sc_app.subscriptions (
    id, user_id, billing_account_id, stripe_customer_id, status, metadata,
    price_id, quantity, cancel_at_period_end, created, current_period_start,
    current_period_end, ended_at, cancel_at, canceled_at, trial_start, trial_end,
    livemode, collection_method, currency, billing_mode, latest_invoice_id,
    automatic_tax_enabled, last_synced_at
  ) values (
    input_subscription->>'id', nullif(input_subscription->>'user_id', '')::uuid,
    (input_subscription->>'billing_account_id')::uuid,
    input_subscription->>'stripe_customer_id',
    (input_subscription->>'status')::sc_app.subscription_status,
    coalesce(input_subscription->'metadata', '{}'::jsonb),
    input_subscription->>'price_id', nullif(input_subscription->>'quantity', '')::integer,
    (input_subscription->>'cancel_at_period_end')::boolean,
    (input_subscription->>'created')::timestamptz,
    (input_subscription->>'current_period_start')::timestamptz,
    (input_subscription->>'current_period_end')::timestamptz,
    nullif(input_subscription->>'ended_at', '')::timestamptz,
    nullif(input_subscription->>'cancel_at', '')::timestamptz,
    nullif(input_subscription->>'canceled_at', '')::timestamptz,
    nullif(input_subscription->>'trial_start', '')::timestamptz,
    nullif(input_subscription->>'trial_end', '')::timestamptz,
    nullif(input_subscription->>'livemode', '')::boolean,
    input_subscription->>'collection_method', input_subscription->>'currency',
    input_subscription->>'billing_mode', input_subscription->>'latest_invoice_id',
    nullif(input_subscription->>'automatic_tax_enabled', '')::boolean,
    timezone('utc', now())
  ) on conflict (id) do update set
    user_id = excluded.user_id,
    billing_account_id = excluded.billing_account_id,
    stripe_customer_id = excluded.stripe_customer_id,
    status = excluded.status, metadata = excluded.metadata,
    price_id = excluded.price_id, quantity = excluded.quantity,
    cancel_at_period_end = excluded.cancel_at_period_end,
    created = excluded.created,
    current_period_start = excluded.current_period_start,
    current_period_end = excluded.current_period_end,
    ended_at = excluded.ended_at, cancel_at = excluded.cancel_at,
    canceled_at = excluded.canceled_at, trial_start = excluded.trial_start,
    trial_end = excluded.trial_end, livemode = excluded.livemode,
    collection_method = excluded.collection_method, currency = excluded.currency,
    billing_mode = excluded.billing_mode, latest_invoice_id = excluded.latest_invoice_id,
    automatic_tax_enabled = excluded.automatic_tax_enabled,
    last_synced_at = excluded.last_synced_at;

  delete from sc_app.subscription_items where subscription_id = input_subscription->>'id';
  for v_item in select value from jsonb_array_elements(coalesce(input_items, '[]'::jsonb)) loop
    insert into sc_app.subscription_items (
      id, subscription_id, price_id, quantity, metadata,
      current_period_start, current_period_end
    ) values (
      v_item->>'id', input_subscription->>'id', v_item->>'price_id',
      nullif(v_item->>'quantity', '')::integer,
      coalesce(v_item->'metadata', '{}'::jsonb),
      (v_item->>'current_period_start')::timestamptz,
      (v_item->>'current_period_end')::timestamptz
    );
  end loop;
end;
$function$;

GRANT EXECUTE ON FUNCTION "sc_api_edge"."billing_upsert_subscription_v2"(jsonb, jsonb) TO "postgres", "service_role";

REVOKE ALL ON FUNCTION "sc_api_edge"."billing_upsert_subscription_v2"(jsonb, jsonb) FROM PUBLIC;
