begin;

-- A billing account is the billable party. It deliberately does not assume
-- that the party is the signed-in user: it can represent a user, team,
-- organisation, tenant, or another application-defined subject.
create table app.billing_accounts (
  id uuid primary key default gen_random_uuid(),
  subject_type text not null check (subject_type in ('user', 'organisation', 'team', 'tenant', 'custom')),
  subject_id uuid not null,
  display_name text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (subject_type, subject_id)
);

create table app.billing_account_members (
  billing_account_id uuid not null references app.billing_accounts(id) on delete cascade,
  user_id uuid not null references app.profiles(id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'billing_admin', 'member')),
  created_at timestamptz not null default timezone('utc', now()),
  primary key (billing_account_id, user_id)
);
create index billing_account_members_user_idx
  on app.billing_account_members (user_id, billing_account_id);

-- Keep the legacy app.customers table during the upgrade window. New code
-- uses this account-scoped mapping, including Stripe mode/account identity.
create table app.stripe_customers (
  id uuid primary key default gen_random_uuid(),
  billing_account_id uuid not null references app.billing_accounts(id) on delete cascade,
  stripe_customer_id text not null,
  stripe_account_id text not null default 'platform',
  livemode boolean,
  billing_address jsonb,
  payment_method jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (billing_account_id, stripe_account_id, livemode),
  unique (stripe_customer_id, stripe_account_id)
);
create index stripe_customers_billing_account_idx
  on app.stripe_customers (billing_account_id);

insert into app.billing_accounts (id, subject_type, subject_id, display_name)
select p.id, 'user', p.id, nullif(trim(concat_ws(' ', p.first_name, p.last_name)), '')
from app.profiles p
on conflict (subject_type, subject_id) do nothing;

insert into app.billing_account_members (billing_account_id, user_id, role)
select b.id, b.subject_id, 'owner'
from app.billing_accounts b
where b.subject_type = 'user'
on conflict (billing_account_id, user_id) do nothing;

insert into app.stripe_customers (
  billing_account_id, stripe_customer_id, billing_address, payment_method
)
select c.id, c.stripe_customer_id, c.billing_address, c.payment_method
from app.customers c
on conflict (stripe_customer_id, stripe_account_id) do nothing;

alter table app.subscriptions
  add column billing_account_id uuid references app.billing_accounts(id),
  add column stripe_customer_id text,
  add column livemode boolean,
  add column collection_method text,
  add column currency text check (currency is null or char_length(currency) = 3),
  add column billing_mode text check (billing_mode is null or billing_mode in ('classic', 'flexible')),
  add column latest_invoice_id text,
  add column automatic_tax_enabled boolean,
  add column last_synced_at timestamptz not null default timezone('utc', now());

update app.subscriptions s
set billing_account_id = s.user_id,
    stripe_customer_id = c.stripe_customer_id
from app.customers c
where c.id = s.user_id;

update app.subscriptions s
set billing_account_id = s.user_id
where s.billing_account_id is null;

alter table app.subscriptions
  alter column billing_account_id set not null,
  alter column user_id drop not null;

create index subscriptions_billing_account_idx
  on app.subscriptions (billing_account_id, status, current_period_end desc);

create table app.subscription_items (
  id text primary key,
  subscription_id text not null references app.subscriptions(id) on delete cascade,
  price_id text not null references app.prices(id),
  quantity integer,
  metadata jsonb not null default '{}'::jsonb,
  current_period_start timestamptz not null,
  current_period_end timestamptz not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);
create index subscription_items_subscription_idx
  on app.subscription_items (subscription_id);
create index subscription_items_price_idx
  on app.subscription_items (price_id);

-- Preserve the old single-item projection as an upgrade seed only. New event
-- processing replaces every subscription's complete item set atomically.
insert into app.subscription_items (
  id, subscription_id, price_id, quantity, current_period_start, current_period_end
)
select 'legacy_' || s.id, s.id, s.price_id, s.quantity, s.current_period_start, s.current_period_end
from app.subscriptions s
where s.price_id is not null
on conflict (id) do nothing;

create table app.billing_features (
  lookup_key text primary key check (lookup_key ~ '^[A-Za-z0-9_.:-]{1,80}$'),
  name text not null,
  description text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table app.product_features (
  product_id text not null references app.products(id) on delete cascade,
  feature_lookup_key text not null references app.billing_features(lookup_key) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (product_id, feature_lookup_key)
);

create table app.entitlement_grants (
  id uuid primary key default gen_random_uuid(),
  billing_account_id uuid not null references app.billing_accounts(id) on delete cascade,
  feature_lookup_key text not null references app.billing_features(lookup_key) on delete cascade,
  source text not null check (source in ('stripe_entitlement', 'subscription', 'manual', 'promotion')),
  source_reference text,
  active boolean not null default true,
  starts_at timestamptz,
  ends_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);
create unique index entitlement_grants_source_key
  on app.entitlement_grants (
    billing_account_id, feature_lookup_key, source, coalesce(source_reference, '')
  );
create index entitlement_grants_active_idx
  on app.entitlement_grants (billing_account_id, feature_lookup_key)
  where active is true;

alter table app.billing_accounts enable row level security;
alter table app.billing_account_members enable row level security;
alter table app.stripe_customers enable row level security;
alter table app.subscription_items enable row level security;
alter table app.billing_features enable row level security;
alter table app.product_features enable row level security;
alter table app.entitlement_grants enable row level security;

revoke all on app.billing_accounts, app.billing_account_members, app.stripe_customers,
  app.subscription_items, app.billing_features, app.product_features,
  app.entitlement_grants from anon, authenticated;
grant all on app.billing_accounts, app.billing_account_members, app.stripe_customers,
  app.subscription_items, app.billing_features, app.product_features,
  app.entitlement_grants to service_role;

create or replace function api.get_billing_overview_by_current_user()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
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
              from app.subscription_items si
              join app.prices pr on pr.id = si.price_id
              left join app.products p on p.id = pr.product_id
              where si.subscription_id = s.id
            ), '[]'::jsonb)
          ) order by s.created desc
        )
        from app.subscriptions s where s.billing_account_id = b.id
      ), '[]'::jsonb),
      'entitlements', coalesce((
        select jsonb_agg(to_jsonb(e) order by e.feature_lookup_key)
        from app.entitlement_grants e
        where e.billing_account_id = b.id
          and e.active is true
          and (e.starts_at is null or e.starts_at <= timezone('utc', now()))
          and (e.ends_at is null or e.ends_at > timezone('utc', now()))
      ), '[]'::jsonb)
    ) order by b.created_at
  ), '[]'::jsonb)
  from app.billing_account_members m
  join app.billing_accounts b on b.id = m.billing_account_id
  where m.user_id = (select auth.uid());
$$;

create or replace function api.get_active_subscription_by_current_user()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select to_jsonb(s) || jsonb_build_object(
    'items', coalesce((
      select jsonb_agg(
        to_jsonb(si) || jsonb_build_object(
          'prices', to_jsonb(pr) || jsonb_build_object('products', to_jsonb(p))
        ) order by si.created_at, si.id
      )
      from app.subscription_items si
      join app.prices pr on pr.id = si.price_id
      left join app.products p on p.id = pr.product_id
      where si.subscription_id = s.id
    ), '[]'::jsonb),
    -- Deprecated aliases retained for one release for existing consumers.
    'prices', to_jsonb(first_price) || jsonb_build_object('products', to_jsonb(first_product))
  )
  from app.subscriptions s
  join app.billing_account_members m on m.billing_account_id = s.billing_account_id
  left join app.prices first_price on first_price.id = s.price_id
  left join app.products first_product on first_product.id = first_price.product_id
  where m.user_id = (select auth.uid()) and s.status in ('trialing', 'active')
  order by s.current_period_end desc
  limit 1;
$$;

create or replace function api.has_billing_access_by_current_user(
  p_feature_lookup_key text default null
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select case
    when p_feature_lookup_key is null then exists (
      select 1
      from app.billing_account_members m
      join app.subscriptions s on s.billing_account_id = m.billing_account_id
      where m.user_id = (select auth.uid()) and s.status in ('trialing', 'active')
    )
    else exists (
      select 1
      from app.billing_account_members m
      join app.entitlement_grants e on e.billing_account_id = m.billing_account_id
      where m.user_id = (select auth.uid())
        and e.feature_lookup_key = p_feature_lookup_key
        and e.active is true
        and (e.starts_at is null or e.starts_at <= timezone('utc', now()))
        and (e.ends_at is null or e.ends_at > timezone('utc', now()))
    )
  end;
$$;

revoke all on function api.get_billing_overview_by_current_user() from public, anon, authenticated;
grant execute on function api.get_billing_overview_by_current_user() to authenticated;
revoke all on function api.has_billing_access_by_current_user(text) from public, anon, authenticated;
grant execute on function api.has_billing_access_by_current_user(text) to authenticated;

create or replace function api_edge.billing_get_or_create_user_account(p_user_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare v_account_id uuid;
begin
  if not exists (select 1 from app.profiles p where p.id = p_user_id) then
    raise exception 'Billing user does not exist' using errcode = '23503';
  end if;
  insert into app.billing_accounts (id, subject_type, subject_id)
  values (p_user_id, 'user', p_user_id)
  on conflict (subject_type, subject_id) do update set updated_at = timezone('utc', now())
  returning id into v_account_id;
  insert into app.billing_account_members (billing_account_id, user_id, role)
  values (v_account_id, p_user_id, 'owner')
  on conflict (billing_account_id, user_id) do nothing;
  return v_account_id;
end;
$$;

create or replace function api_edge.billing_user_can_manage(
  p_billing_account_id uuid, p_user_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from app.billing_account_members m
    where m.billing_account_id = p_billing_account_id
      and m.user_id = p_user_id
      and m.role in ('owner', 'billing_admin')
  );
$$;

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
  from app.stripe_customers c
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
  insert into app.stripe_customers (
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

create or replace function api_edge.billing_get_account_by_customer(p_stripe_customer_id text)
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select c.billing_account_id from app.stripe_customers c
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
  from app.stripe_customers c order by c.created_at;
$$;

create or replace function api_edge.billing_update_payment_method_for_account(
  p_billing_account_id uuid, p_billing_address jsonb, p_payment_method jsonb
)
returns void
language sql
security definer
set search_path = ''
as $$
  update app.stripe_customers
  set billing_address = p_billing_address,
      payment_method = p_payment_method,
      updated_at = timezone('utc', now())
  where billing_account_id = p_billing_account_id;
$$;

create or replace function api_edge.billing_upsert_subscription_v2(
  p_subscription jsonb, p_items jsonb
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare v_item jsonb;
begin
  insert into app.subscriptions (
    id, user_id, billing_account_id, stripe_customer_id, status, metadata,
    price_id, quantity, cancel_at_period_end, created, current_period_start,
    current_period_end, ended_at, cancel_at, canceled_at, trial_start, trial_end,
    livemode, collection_method, currency, billing_mode, latest_invoice_id,
    automatic_tax_enabled, last_synced_at
  ) values (
    p_subscription->>'id', nullif(p_subscription->>'user_id', '')::uuid,
    (p_subscription->>'billing_account_id')::uuid,
    p_subscription->>'stripe_customer_id',
    (p_subscription->>'status')::app.subscription_status,
    coalesce(p_subscription->'metadata', '{}'::jsonb),
    p_subscription->>'price_id', nullif(p_subscription->>'quantity', '')::integer,
    (p_subscription->>'cancel_at_period_end')::boolean,
    (p_subscription->>'created')::timestamptz,
    (p_subscription->>'current_period_start')::timestamptz,
    (p_subscription->>'current_period_end')::timestamptz,
    nullif(p_subscription->>'ended_at', '')::timestamptz,
    nullif(p_subscription->>'cancel_at', '')::timestamptz,
    nullif(p_subscription->>'canceled_at', '')::timestamptz,
    nullif(p_subscription->>'trial_start', '')::timestamptz,
    nullif(p_subscription->>'trial_end', '')::timestamptz,
    nullif(p_subscription->>'livemode', '')::boolean,
    p_subscription->>'collection_method', p_subscription->>'currency',
    p_subscription->>'billing_mode', p_subscription->>'latest_invoice_id',
    nullif(p_subscription->>'automatic_tax_enabled', '')::boolean,
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

  delete from app.subscription_items where subscription_id = p_subscription->>'id';
  for v_item in select value from jsonb_array_elements(coalesce(p_items, '[]'::jsonb)) loop
    insert into app.subscription_items (
      id, subscription_id, price_id, quantity, metadata,
      current_period_start, current_period_end
    ) values (
      v_item->>'id', p_subscription->>'id', v_item->>'price_id',
      nullif(v_item->>'quantity', '')::integer,
      coalesce(v_item->'metadata', '{}'::jsonb),
      (v_item->>'current_period_start')::timestamptz,
      (v_item->>'current_period_end')::timestamptz
    );
  end loop;
end;
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
  select c.billing_account_id into v_account_id from app.stripe_customers c
  where c.stripe_customer_id = p_stripe_customer_id;
  if v_account_id is null then
    raise exception 'Stripe customer mapping not found' using errcode = 'P0002';
  end if;
  update app.entitlement_grants set active = false, updated_at = timezone('utc', now())
  where billing_account_id = v_account_id and source = 'stripe_entitlement';
  for v_entitlement in
    select value from jsonb_array_elements(coalesce(p_entitlements, '[]'::jsonb))
  loop
    insert into app.billing_features (lookup_key, name)
    values (v_entitlement->>'lookup_key', coalesce(v_entitlement->>'lookup_key', ''))
    on conflict (lookup_key) do nothing;
    insert into app.entitlement_grants (
      billing_account_id, feature_lookup_key, source, source_reference, active
    ) values (
      v_account_id, v_entitlement->>'lookup_key', 'stripe_entitlement',
      v_entitlement->>'id', true
    ) on conflict (
      billing_account_id, feature_lookup_key, source, (coalesce(source_reference, ''))
    ) do update set active = true, updated_at = timezone('utc', now());
  end loop;
end;
$$;

revoke all on all functions in schema api_edge from public, anon, authenticated;
grant execute on all functions in schema api_edge to service_role;

notify pgrst, 'reload schema';
commit;
