begin;

create schema if not exists app;

-- The starter historically created billing objects in public. Move them as a unit so
-- existing data, foreign keys, RLS state, and the realtime publication keep their OIDs.
drop trigger if exists on_auth_user_created on auth.users;

alter type public.pricing_type set schema app;
alter type public.pricing_plan_interval set schema app;
alter type public.subscription_status set schema app;

alter table public.users set schema app;
alter table public.customers set schema app;
alter table public.products set schema app;
alter table public.prices set schema app;
alter table public.subscriptions set schema app;
alter function public.handle_new_user() set schema app;

create or replace function app.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into app.users (id, full_name, avatar_url)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url')
  on conflict (id) do nothing;
  return new;
end;
$$;

revoke all on function app.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function app.handle_new_user();

-- A null customer mapping has no usable Stripe identity. Duplicate Stripe customer IDs
-- are ambiguous and must be reconciled deliberately rather than silently reassigned.
delete from app.customers where stripe_customer_id is null;

do $$
begin
  if exists (
    select stripe_customer_id
    from app.customers
    group by stripe_customer_id
    having count(*) > 1
  ) then
    raise exception 'Duplicate Stripe customer IDs must be reconciled before this migration can continue';
  end if;
end;
$$;

alter table app.customers
  alter column stripe_customer_id set not null;

alter table app.customers
  add constraint customers_stripe_customer_id_key unique (stripe_customer_id);

-- Stripe supplies these values. Defaults would fabricate lifecycle timestamps when a
-- handler omits a field, so require explicit values or preserve null.
alter table app.subscriptions
  alter column created drop default,
  alter column current_period_start drop default,
  alter column current_period_end drop default,
  alter column ended_at drop default,
  alter column cancel_at drop default,
  alter column canceled_at drop default,
  alter column trial_start drop default,
  alter column trial_end drop default;

create table app.stripe_events (
  event_id text primary key,
  event_type text not null,
  object_id text,
  api_version text,
  livemode boolean not null,
  status text not null default 'pending'
    check (status in ('pending', 'processing', 'processed', 'failed')),
  attempt_count integer not null default 0 check (attempt_count >= 0),
  received_at timestamp with time zone not null default timezone('utc'::text, now()),
  processing_started_at timestamp with time zone,
  processed_at timestamp with time zone,
  next_attempt_at timestamp with time zone not null default timezone('utc'::text, now()),
  last_error text
);

create table app.stripe_event_payloads (
  event_id text primary key references app.stripe_events(event_id) on delete cascade,
  payload jsonb not null,
  expires_at timestamp with time zone not null
    default timezone('utc'::text, now()) + interval '30 days'
);

create index stripe_events_retryable_idx
on app.stripe_events (next_attempt_at, received_at)
where status in ('pending', 'failed');

alter table app.stripe_events enable row level security;
alter table app.stripe_event_payloads enable row level security;

create or replace function app.accept_stripe_event(
  p_event_id text, p_event_type text, p_object_id text, p_api_version text,
  p_livemode boolean, p_payload jsonb
)
returns boolean language plpgsql security definer set search_path = '' as $$
declare inserted_count integer;
begin
  insert into app.stripe_events (event_id, event_type, object_id, api_version, livemode)
  values (p_event_id, p_event_type, p_object_id, p_api_version, p_livemode)
  on conflict (event_id) do nothing;
  get diagnostics inserted_count = row_count;
  if inserted_count = 0 then return false; end if;
  insert into app.stripe_event_payloads (event_id, payload) values (p_event_id, p_payload);
  return true;
end;
$$;
revoke all on function app.accept_stripe_event(text, text, text, text, boolean, jsonb) from public, anon, authenticated;
grant execute on function app.accept_stripe_event(text, text, text, text, boolean, jsonb) to service_role;

create or replace function app.claim_stripe_event(p_event_id text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  claimed_event_id text;
begin
  update app.stripe_events
  set
    status = 'processing',
    attempt_count = attempt_count + 1,
    processing_started_at = timezone('utc'::text, now()),
    last_error = null
  where event_id = p_event_id
    and (
      (status in ('pending', 'failed') and next_attempt_at <= timezone('utc'::text, now()))
      or (
        status = 'processing'
        and processing_started_at < timezone('utc'::text, now()) - interval '5 minutes'
      )
    )
  returning event_id into claimed_event_id;

  return claimed_event_id is not null;
end;
$$;

revoke all on function app.claim_stripe_event(text) from public, anon, authenticated;
grant execute on function app.claim_stripe_event(text) to service_role;

create or replace function app.list_claimable_stripe_events(p_limit integer default 20)
returns table (event_id text)
language sql
security definer
set search_path = ''
as $$
  select stripe_events.event_id
  from app.stripe_events
  where (
    status in ('pending', 'failed')
    and next_attempt_at <= timezone('utc'::text, now())
  ) or (
    status = 'processing'
    and processing_started_at < timezone('utc'::text, now()) - interval '5 minutes'
  )
  order by received_at
  limit least(greatest(coalesce(p_limit, 20), 1), 100);
$$;

revoke all on function app.list_claimable_stripe_events(integer) from public, anon, authenticated;
grant execute on function app.list_claimable_stripe_events(integer) to service_role;

-- Rebuild explicit, least-privilege Data API access. RLS and object grants are both
-- required; service_role remains the only role that can mutate Stripe projections.
alter table app.users enable row level security;
alter table app.customers enable row level security;
alter table app.products enable row level security;
alter table app.prices enable row level security;
alter table app.subscriptions enable row level security;

drop policy if exists "Can view own user data." on app.users;
drop policy if exists "Can update own user data." on app.users;
drop policy if exists "Users can view own profile" on app.users;
drop policy if exists "Users can update own profile" on app.users;
create policy "Users can view own profile" on app.users
for select to authenticated
using ((select auth.uid()) = id);
create policy "Users can update own profile" on app.users
for update to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

drop policy if exists "Allow public read-only access." on app.products;
drop policy if exists "Products are readable" on app.products;
create policy "Products are readable" on app.products
for select to anon, authenticated
using (true);

drop policy if exists "Allow public read-only access." on app.prices;
drop policy if exists "Prices are readable" on app.prices;
create policy "Prices are readable" on app.prices
for select to anon, authenticated
using (true);

drop policy if exists "Can only view own subs data." on app.subscriptions;
drop policy if exists "Users can view own subscriptions" on app.subscriptions;
create policy "Users can view own subscriptions" on app.subscriptions
for select to authenticated
using ((select auth.uid()) = user_id);

revoke all on app.users, app.customers, app.products, app.prices, app.subscriptions, app.stripe_events, app.stripe_event_payloads
from anon, authenticated;
grant usage on schema app to anon, authenticated, service_role;
grant select on app.products, app.prices to anon, authenticated;
grant select on app.users, app.subscriptions to authenticated;
grant update (full_name, avatar_url) on app.users to authenticated;
grant all on app.users, app.customers, app.products, app.prices, app.subscriptions, app.stripe_events, app.stripe_event_payloads
to service_role;

alter role authenticator set pgrst.db_schemas = 'public, graphql_public, app';
notify pgrst, 'reload config';
notify pgrst, 'reload schema';

commit;
