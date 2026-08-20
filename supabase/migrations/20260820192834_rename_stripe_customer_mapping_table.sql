begin;

-- These rows map a Supacharger billing account and Stripe mode/account to an
-- external Stripe Customer. Name the table and its local key for that mapping
-- rather than making the local UUID look like a Stripe Customer identifier.
alter table app.stripe_customers rename to stripe_customer_mappings;
alter table app.stripe_customer_mappings rename column id to stripe_customer_mapping_id;

-- PostgreSQL preserves old constraint and index names when a table or column is
-- renamed. Align those identifiers as part of the canonical schema contract.
do $$
declare
  v_constraint_name name;
begin
  select conname
  into v_constraint_name
  from pg_constraint
  where conrelid = 'app.stripe_customer_mappings'::regclass
    and contype = 'p';

  if v_constraint_name is not null
     and v_constraint_name <> 'stripe_customer_mappings_pkey' then
    execute format(
      'alter table app.stripe_customer_mappings rename constraint %I to stripe_customer_mappings_pkey',
      v_constraint_name
    );
  end if;

  select conname
  into v_constraint_name
  from pg_constraint
  where conrelid = 'app.stripe_customer_mappings'::regclass
    and contype = 'f'
    and pg_get_constraintdef(oid) =
      'FOREIGN KEY (billing_account_id) REFERENCES app.billing_accounts(id) ON DELETE CASCADE';

  if v_constraint_name is not null
     and v_constraint_name <> 'stripe_customer_mappings_billing_account_id_fkey' then
    execute format(
      'alter table app.stripe_customer_mappings rename constraint %I to stripe_customer_mappings_billing_account_id_fkey',
      v_constraint_name
    );
  end if;

  select conname
  into v_constraint_name
  from pg_constraint
  where conrelid = 'app.stripe_customer_mappings'::regclass
    and contype = 'u'
    and pg_get_constraintdef(oid) =
      'UNIQUE (billing_account_id, stripe_account_id, livemode)';

  if v_constraint_name is not null
     and v_constraint_name <> 'stripe_customer_mappings_account_mode_key' then
    execute format(
      'alter table app.stripe_customer_mappings rename constraint %I to stripe_customer_mappings_account_mode_key',
      v_constraint_name
    );
  end if;

  select conname
  into v_constraint_name
  from pg_constraint
  where conrelid = 'app.stripe_customer_mappings'::regclass
    and contype = 'u'
    and pg_get_constraintdef(oid) =
      'UNIQUE (stripe_customer_id, stripe_account_id)';

  if v_constraint_name is not null
     and v_constraint_name <> 'stripe_customer_mappings_external_customer_key' then
    execute format(
      'alter table app.stripe_customer_mappings rename constraint %I to stripe_customer_mappings_external_customer_key',
      v_constraint_name
    );
  end if;
end;
$$;

alter index app.stripe_customers_billing_account_idx
  rename to stripe_customer_mappings_billing_account_idx;

-- Keep the established PostgREST argument names. Replacing these function
-- bodies updates their private-table dependency without changing the API.
create or replace function api_edge.billing_get_customer_for_account(
  p_billing_account_id uuid, p_livemode boolean default null
)
returns table (stripe_customer_id text, livemode boolean)
language sql
stable
security definer
set search_path = ''
as $$
  select c.stripe_customer_id, c.livemode
  from app.stripe_customer_mappings c
  where c.billing_account_id = p_billing_account_id
    and (p_livemode is null or c.livemode = p_livemode or c.livemode is null)
  order by c.livemode nulls last
  limit 1;
$$;

create or replace function api_edge.billing_put_customer_for_account(
  p_billing_account_id uuid,
  p_stripe_customer_id text,
  p_livemode boolean,
  p_stripe_account_id text default 'platform'
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare v_customer_id text;
begin
  insert into app.stripe_customer_mappings (
    billing_account_id, stripe_customer_id, stripe_account_id, livemode
  ) values (
    p_billing_account_id, p_stripe_customer_id, p_stripe_account_id, p_livemode
  )
  on conflict (billing_account_id, stripe_account_id, livemode)
  do update set stripe_customer_id = excluded.stripe_customer_id,
    updated_at = timezone('utc', now())
  returning stripe_customer_id into v_customer_id;
  return v_customer_id;
end;
$$;

create or replace function api_edge.billing_get_account_by_customer(
  p_stripe_customer_id text
)
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select c.billing_account_id
  from app.stripe_customer_mappings c
  where c.stripe_customer_id = p_stripe_customer_id;
$$;

create or replace function api_edge.billing_list_customer_mappings()
returns table (billing_account_id uuid, stripe_customer_id text, livemode boolean)
language sql
stable
security definer
set search_path = ''
as $$
  select c.billing_account_id, c.stripe_customer_id, c.livemode
  from app.stripe_customer_mappings c
  order by c.created_at;
$$;

create or replace function api_edge.billing_update_payment_method_for_account(
  p_billing_account_id uuid, p_billing_address jsonb, p_payment_method jsonb
)
returns void
language sql
security definer
set search_path = ''
as $$
  update app.stripe_customer_mappings
  set billing_address = p_billing_address,
      payment_method = p_payment_method,
      updated_at = timezone('utc', now())
  where billing_account_id = p_billing_account_id;
$$;

create or replace function api_edge.billing_replace_stripe_entitlements(
  p_stripe_customer_id text, p_entitlements jsonb
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare v_account_id uuid; v_entitlement jsonb;
begin
  select c.billing_account_id
  into v_account_id
  from app.stripe_customer_mappings c
  where c.stripe_customer_id = p_stripe_customer_id;

  if v_account_id is null then
    raise exception 'Stripe customer mapping not found' using errcode = 'P0002';
  end if;

  update app.entitlement_grants
  set active = false, updated_at = timezone('utc', now())
  where billing_account_id = v_account_id
    and source = 'stripe_entitlement';

  for v_entitlement in
    select value
    from jsonb_array_elements(coalesce(p_entitlements, '[]'::jsonb))
  loop
    insert into app.billing_features (lookup_key, name)
    values (
      v_entitlement->>'lookup_key',
      coalesce(v_entitlement->>'lookup_key', '')
    )
    on conflict (lookup_key) do nothing;

    insert into app.entitlement_grants (
      billing_account_id, feature_lookup_key, source, source_reference, active
    ) values (
      v_account_id,
      v_entitlement->>'lookup_key',
      'stripe_entitlement',
      v_entitlement->>'id',
      true
    )
    on conflict (
      billing_account_id, feature_lookup_key, source, (coalesce(source_reference, ''))
    )
    do update set active = true, updated_at = timezone('utc', now());
  end loop;
end;
$$;

revoke all on function api_edge.billing_get_customer_for_account(uuid, boolean)
  from public, anon, authenticated;
revoke all on function api_edge.billing_put_customer_for_account(uuid, text, boolean, text)
  from public, anon, authenticated;
revoke all on function api_edge.billing_get_account_by_customer(text)
  from public, anon, authenticated;
revoke all on function api_edge.billing_list_customer_mappings()
  from public, anon, authenticated;
revoke all on function api_edge.billing_update_payment_method_for_account(uuid, jsonb, jsonb)
  from public, anon, authenticated;
revoke all on function api_edge.billing_replace_stripe_entitlements(text, jsonb)
  from public, anon, authenticated;

grant execute on function api_edge.billing_get_customer_for_account(uuid, boolean)
  to service_role;
grant execute on function api_edge.billing_put_customer_for_account(uuid, text, boolean, text)
  to service_role;
grant execute on function api_edge.billing_get_account_by_customer(text)
  to service_role;
grant execute on function api_edge.billing_list_customer_mappings()
  to service_role;
grant execute on function api_edge.billing_update_payment_method_for_account(uuid, jsonb, jsonb)
  to service_role;
grant execute on function api_edge.billing_replace_stripe_entitlements(text, jsonb)
  to service_role;

notify pgrst, 'reload schema';

commit;
