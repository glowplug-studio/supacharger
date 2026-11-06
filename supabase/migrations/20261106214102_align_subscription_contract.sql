SET local check_function_bodies = off;

CREATE OR REPLACE FUNCTION sc_api.get_active_subscription_by_current_user()
  RETURNS jsonb
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
  select to_jsonb(s) || jsonb_build_object(
    'items', coalesce((
      select jsonb_agg(
        to_jsonb(si) || jsonb_build_object(
          'prices', to_jsonb(pr) || jsonb_build_object('products', to_jsonb(p))
        ) order by si.created_at, si.id
      )
      from sc_app.subscription_items si
      join sc_app.prices pr on pr.id = si.price_id
      left join sc_app.products p on p.id = pr.product_id
      where si.subscription_id = s.subscription_id
    ), '[]'::jsonb),
    -- Deprecated aliases retained for one release for existing consumers.
    'prices', to_jsonb(first_price) || jsonb_build_object('products', to_jsonb(first_product))
  )
  from sc_app.subscriptions s
  join sc_app.billing_account_members m on m.billing_account_id = s.billing_account_id
  left join sc_app.prices first_price on first_price.id = s.price_id
  left join sc_app.products first_product on first_product.id = first_price.product_id
  where m.user_id = (select auth.uid()) and s.status in ('trialing', 'active')
  order by s.current_period_end desc
  limit 1;
$function$;

CREATE OR REPLACE FUNCTION sc_api.get_billing_overview_by_current_user()
  RETURNS jsonb
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
  select coalesce(jsonb_agg(
    to_jsonb(b) || jsonb_build_object(
      'member_role', m.role,
      'subscriptions', coalesce((
        select jsonb_agg(
          to_jsonb(s) || jsonb_build_object(
            'items', coalesce((
              select jsonb_agg(
                to_jsonb(si) || jsonb_build_object(
                  'price', to_jsonb(pr) || jsonb_build_object('product', to_jsonb(p))
                ) order by si.created_at, si.id
              )
              from sc_app.subscription_items si
              join sc_app.prices pr on pr.id = si.price_id
              left join sc_app.products p on p.id = pr.product_id
              where si.subscription_id = s.subscription_id
            ), '[]'::jsonb)
          ) order by s.created desc
        )
        from sc_app.subscriptions s where s.billing_account_id = b.id
      ), '[]'::jsonb),
      'entitlements', coalesce((
        select jsonb_agg(to_jsonb(e) order by e.feature_lookup_key)
        from sc_app.entitlement_grants e
        where e.billing_account_id = b.id
          and e.active is true
          and (e.starts_at is null or e.starts_at <= timezone('utc', now()))
          and (e.ends_at is null or e.ends_at > timezone('utc', now()))
      ), '[]'::jsonb)
    ) order by b.created_at
  ), '[]'::jsonb)
  from sc_app.billing_account_members m
  join sc_app.billing_accounts b on b.id = m.billing_account_id
  where m.user_id = (select auth.uid());
$function$;

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
    subscription_id, user_id, billing_account_id, stripe_customer_id, status, metadata,
    price_id, quantity, cancel_at_period_end, created, current_period_start,
    current_period_end, ended_at, cancel_at, canceled_at, trial_start, trial_end,
    livemode, collection_method, currency, billing_mode, latest_invoice_id,
    automatic_tax_enabled, last_synced_at
  ) values (
    input_subscription->>'subscription_id', nullif(input_subscription->>'user_id', '')::uuid,
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
  ) on conflict (subscription_id) do update set
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

  delete from sc_app.subscription_items where subscription_id = input_subscription->>'subscription_id';
  for v_item in select value from jsonb_array_elements(coalesce(input_items, '[]'::jsonb)) loop
    insert into sc_app.subscription_items (
      id, subscription_id, price_id, quantity, metadata,
      current_period_start, current_period_end
    ) values (
      v_item->>'id', input_subscription->>'subscription_id', v_item->>'price_id',
      nullif(v_item->>'quantity', '')::integer,
      coalesce(v_item->'metadata', '{}'::jsonb),
      (v_item->>'current_period_start')::timestamptz,
      (v_item->>'current_period_end')::timestamptz
    );
  end loop;
end;
$function$;
