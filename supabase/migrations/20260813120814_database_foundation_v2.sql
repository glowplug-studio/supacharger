begin;

create schema if not exists app;
create schema if not exists api;
create schema if not exists api_edge;

revoke all on schema app, api, api_edge from public;
grant usage on schema api to anon, authenticated, service_role;
grant usage on schema api_edge to service_role;

create type app.pricing_type as enum ('one_time', 'recurring');
create type app.pricing_plan_interval as enum ('day', 'week', 'month', 'year');
create type app.subscription_status as enum (
  'trialing', 'active', 'canceled', 'incomplete', 'incomplete_expired',
  'past_due', 'unpaid', 'paused'
);

create table app.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  first_name text not null default '' check (char_length(first_name) <= 100),
  last_name text not null default '' check (char_length(last_name) <= 100),
  username text,
  email text,
  avatar_path text,
  header_image_path text,
  language_code text check (language_code is null or language_code ~ '^[a-z]{2}$'),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint profiles_username_format check (
    username is null or username ~ '^[A-Za-z0-9_-]{3,40}$'
  ),
  constraint profiles_avatar_path_owner check (
    avatar_path is null or avatar_path like (id::text || '/avatar-%')
  ),
  constraint profiles_header_image_path_owner check (
    header_image_path is null or header_image_path like (id::text || '/headers/header-%')
  )
);
create unique index profiles_username_lower_key
  on app.profiles (lower(username)) where username is not null;

create table app.customers (
  id uuid primary key references app.profiles(id) on delete cascade,
  stripe_customer_id text not null unique,
  billing_address jsonb,
  payment_method jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table app.products (
  id text primary key,
  active boolean,
  name text,
  description text,
  image text,
  metadata jsonb
);

create table app.prices (
  id text primary key,
  product_id text references app.products(id) on delete cascade,
  active boolean,
  description text,
  unit_amount bigint,
  currency text check (currency is null or char_length(currency) = 3),
  type app.pricing_type,
  interval app.pricing_plan_interval,
  interval_count integer,
  trial_period_days integer,
  metadata jsonb
);

create table app.subscriptions (
  id text primary key,
  user_id uuid not null references app.profiles(id) on delete cascade,
  status app.subscription_status,
  metadata jsonb,
  price_id text references app.prices(id),
  quantity integer,
  cancel_at_period_end boolean,
  created timestamptz not null,
  current_period_start timestamptz not null,
  current_period_end timestamptz not null,
  ended_at timestamptz,
  cancel_at timestamptz,
  canceled_at timestamptz,
  trial_start timestamptz,
  trial_end timestamptz
);

create table app.stripe_events (
  event_id text primary key,
  event_type text not null,
  object_id text,
  api_version text,
  livemode boolean not null,
  status text not null default 'pending'
    check (status in ('pending', 'processing', 'processed', 'failed')),
  attempt_count integer not null default 0 check (attempt_count >= 0),
  received_at timestamptz not null default timezone('utc', now()),
  processing_started_at timestamptz,
  processed_at timestamptz,
  next_attempt_at timestamptz not null default timezone('utc', now()),
  last_error text
);

create table app.stripe_event_payloads (
  event_id text primary key references app.stripe_events(event_id) on delete cascade,
  payload jsonb not null,
  expires_at timestamptz not null default timezone('utc', now()) + interval '30 days'
);
create index stripe_events_retryable_idx
  on app.stripe_events (next_attempt_at, received_at)
  where status in ('pending', 'failed');

alter table app.profiles enable row level security;
alter table app.customers enable row level security;
alter table app.products enable row level security;
alter table app.prices enable row level security;
alter table app.subscriptions enable row level security;
alter table app.stripe_events enable row level security;
alter table app.stripe_event_payloads enable row level security;

create policy profiles_select_own on app.profiles
  for select to authenticated using ((select auth.uid()) = id);
create policy profiles_update_own on app.profiles
  for update to authenticated
  using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
create policy products_read on app.products
  for select to anon, authenticated using (true);
create policy prices_read on app.prices
  for select to anon, authenticated using (true);
create policy subscriptions_select_own on app.subscriptions
  for select to authenticated using ((select auth.uid()) = user_id);

revoke all on all tables in schema app from anon, authenticated;
grant all on all tables in schema app to service_role;

create or replace function app.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create trigger profiles_touch_updated_at
before update on app.profiles
for each row execute function app.touch_updated_at();
create trigger customers_touch_updated_at
before update on app.customers
for each row execute function app.touch_updated_at();

create or replace function app.handle_auth_user_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into app.profiles (
    id, first_name, last_name, username, email, avatar_path
  ) values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'first_name', ''),
    coalesce(new.raw_user_meta_data ->> 'last_name', ''),
    nullif(new.raw_user_meta_data ->> 'username', ''),
    new.email,
    case
      when new.raw_user_meta_data ->> 'avatar_path' like (new.id::text || '/avatar-%')
      then new.raw_user_meta_data ->> 'avatar_path'
      else null
    end
  )
  on conflict (id) do update set email = excluded.email;
  return new;
end;
$$;
revoke all on function app.handle_auth_user_profile() from public, anon, authenticated;

create trigger on_auth_user_created_profile
after insert on auth.users
for each row execute function app.handle_auth_user_profile();
create trigger on_auth_user_email_updated_profile
after update of email on auth.users
for each row execute function app.handle_auth_user_profile();

create or replace function api.get_account_profile_by_current_user()
returns table (
  id uuid,
  first_name text,
  last_name text,
  username text,
  email text,
  avatar_path text,
  header_image_path text,
  language_code text,
  created_at timestamptz,
  updated_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select p.id, p.first_name, p.last_name, p.username, p.email,
    p.avatar_path, p.header_image_path, p.language_code, p.created_at, p.updated_at
  from app.profiles p
  where p.id = (select auth.uid())
    and coalesce(((select auth.jwt()) ->> 'is_anonymous')::boolean, false) = false;
$$;

create or replace function api.is_profile_complete_by_current_user()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((
    select nullif(btrim(p.first_name), '') is not null
      and nullif(btrim(p.last_name), '') is not null
      and nullif(btrim(p.username), '') is not null
    from app.profiles p
    where p.id = (select auth.uid())
  ), false);
$$;

create or replace function api.check_account_username_available(p_username text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select btrim(coalesce(p_username, '')) ~ '^[A-Za-z0-9_-]{3,40}$'
    and not exists (
      select 1 from app.profiles p
      where lower(p.username) = lower(btrim(p_username))
        and p.id <> (select auth.uid())
    );
$$;

create or replace function api.update_account_profile_by_current_user(
  p_first_name text,
  p_last_name text,
  p_username text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_first_name text := btrim(coalesce(p_first_name, ''));
  v_last_name text := btrim(coalesce(p_last_name, ''));
  v_username text := btrim(coalesce(p_username, ''));
begin
  if v_user_id is null or coalesce(((select auth.jwt()) ->> 'is_anonymous')::boolean, false) then
    raise exception 'Verified account required' using errcode = '42501';
  end if;
  if char_length(v_first_name) not between 1 and 100
    or char_length(v_last_name) not between 1 and 100 then
    raise exception 'First and last names are required and must be at most 100 characters'
      using errcode = '22023';
  end if;
  if v_username !~ '^[A-Za-z0-9_-]{3,40}$' then
    raise exception 'Username must be 3-40 letters, numbers, underscores, or hyphens'
      using errcode = '22023';
  end if;
  if exists (
    select 1 from app.profiles p
    where lower(p.username) = lower(v_username) and p.id <> v_user_id
  ) then
    raise exception 'Username is already in use' using errcode = '23505';
  end if;
  update app.profiles
  set first_name = v_first_name, last_name = v_last_name, username = v_username
  where id = v_user_id;
end;
$$;

create or replace function api.update_account_language_by_current_user(p_language_code text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare v_user_id uuid := (select auth.uid());
begin
  if v_user_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;
  if p_language_code is not null and p_language_code !~ '^[a-z]{2}$' then
    raise exception 'Language code must be a lowercase ISO 639-1 code' using errcode = '22023';
  end if;
  update app.profiles set language_code = p_language_code where id = v_user_id;
end;
$$;

create or replace function api.update_account_avatar_by_current_user(p_avatar_path text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_path text := nullif(btrim(coalesce(p_avatar_path, '')), '');
begin
  if v_user_id is null then raise exception 'Authentication required' using errcode = '42501'; end if;
  if v_path is not null and v_path not like (v_user_id::text || '/avatar-%') then
    raise exception 'Avatar path must be inside your profile folder' using errcode = '23514';
  end if;
  update app.profiles set avatar_path = v_path where id = v_user_id;
end;
$$;

create or replace function api.update_account_header_image_by_current_user(p_header_image_path text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_path text := nullif(btrim(coalesce(p_header_image_path, '')), '');
begin
  if v_user_id is null then raise exception 'Authentication required' using errcode = '42501'; end if;
  if v_path is not null and v_path not like (v_user_id::text || '/headers/header-%') then
    raise exception 'Header path must be inside your profile header folder' using errcode = '23514';
  end if;
  update app.profiles set header_image_path = v_path where id = v_user_id;
end;
$$;

create or replace function api.get_user_profiles_by_identifiers(p_identifiers text[])
returns table (
  user_id uuid,
  first_name text,
  last_name text,
  username text,
  avatar_path text,
  header_image_path text
)
language sql
stable
security definer
set search_path = ''
as $$
  with requested as (
    select distinct lower(btrim(identifier)) as identifier
    from unnest(coalesce(p_identifiers, array[]::text[])) as identifier
    where btrim(identifier) <> ''
  )
  select p.id, p.first_name, p.last_name, p.username, p.avatar_path, p.header_image_path
  from app.profiles p
  join requested r on lower(p.id::text) = r.identifier or lower(p.username) = r.identifier
  where (select auth.uid()) is not null
    and coalesce(((select auth.jwt()) ->> 'is_anonymous')::boolean, false) = false
  order by p.updated_at desc;
$$;

create or replace function api.get_active_products()
returns table (
  id text, active boolean, name text, description text, image text, metadata jsonb, prices jsonb
)
language sql
stable
security definer
set search_path = ''
as $$
  select p.id, p.active, p.name, p.description, p.image, p.metadata,
    coalesce(jsonb_agg(to_jsonb(pr) order by pr.unit_amount)
      filter (where pr.id is not null and pr.active is true), '[]'::jsonb)
  from app.products p
  left join app.prices pr on pr.product_id = p.id
  where p.active is true
  group by p.id
  order by coalesce((p.metadata ->> 'index')::integer, 2147483647), p.name;
$$;

create or replace function api.get_active_subscription_by_current_user()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select to_jsonb(s) || jsonb_build_object(
    'prices', to_jsonb(pr) || jsonb_build_object('products', to_jsonb(p))
  )
  from app.subscriptions s
  left join app.prices pr on pr.id = s.price_id
  left join app.products p on p.id = pr.product_id
  where s.user_id = (select auth.uid()) and s.status in ('trialing', 'active')
  order by s.current_period_end desc
  limit 1;
$$;

revoke all on all functions in schema api from public, anon, authenticated;
grant execute on function api.get_active_products() to anon, authenticated;
grant execute on function api.get_account_profile_by_current_user() to authenticated;
grant execute on function api.is_profile_complete_by_current_user() to authenticated;
grant execute on function api.check_account_username_available(text) to authenticated;
grant execute on function api.update_account_profile_by_current_user(text, text, text) to authenticated;
grant execute on function api.update_account_language_by_current_user(text) to authenticated;
grant execute on function api.update_account_avatar_by_current_user(text) to authenticated;
grant execute on function api.update_account_header_image_by_current_user(text) to authenticated;
grant execute on function api.get_user_profiles_by_identifiers(text[]) to authenticated;
grant execute on function api.get_active_subscription_by_current_user() to authenticated;

create or replace function api_edge.billing_get_customer(p_user_id uuid)
returns table (stripe_customer_id text)
language sql stable security definer set search_path = '' as $$
  select c.stripe_customer_id from app.customers c where c.id = p_user_id;
$$;

create or replace function api_edge.billing_put_customer(p_user_id uuid, p_stripe_customer_id text)
returns text
language plpgsql security definer set search_path = '' as $$
declare v_customer_id text;
begin
  insert into app.customers (id, stripe_customer_id)
  values (p_user_id, p_stripe_customer_id)
  on conflict (id) do nothing;
  select c.stripe_customer_id into v_customer_id from app.customers c where c.id = p_user_id;
  return v_customer_id;
end;
$$;

create or replace function api_edge.billing_get_user_id(p_stripe_customer_id text)
returns uuid
language sql stable security definer set search_path = '' as $$
  select c.id from app.customers c where c.stripe_customer_id = p_stripe_customer_id;
$$;

create or replace function api_edge.billing_upsert_product(p_product jsonb)
returns void
language sql security definer set search_path = '' as $$
  insert into app.products (id, active, name, description, image, metadata)
  values (p_product->>'id', (p_product->>'active')::boolean, p_product->>'name',
    p_product->>'description', p_product->>'image', p_product->'metadata')
  on conflict (id) do update set active = excluded.active, name = excluded.name,
    description = excluded.description, image = excluded.image, metadata = excluded.metadata;
$$;

create or replace function api_edge.billing_upsert_price(p_price jsonb)
returns void
language sql security definer set search_path = '' as $$
  insert into app.prices (
    id, product_id, active, description, unit_amount, currency, type,
    interval, interval_count, trial_period_days, metadata
  ) values (
    p_price->>'id', p_price->>'product_id', (p_price->>'active')::boolean,
    p_price->>'description', (p_price->>'unit_amount')::bigint, p_price->>'currency',
    (p_price->>'type')::app.pricing_type,
    nullif(p_price->>'interval', '')::app.pricing_plan_interval,
    (p_price->>'interval_count')::integer, (p_price->>'trial_period_days')::integer,
    p_price->'metadata'
  ) on conflict (id) do update set product_id = excluded.product_id,
    active = excluded.active, description = excluded.description,
    unit_amount = excluded.unit_amount, currency = excluded.currency, type = excluded.type,
    interval = excluded.interval, interval_count = excluded.interval_count,
    trial_period_days = excluded.trial_period_days, metadata = excluded.metadata;
$$;

create or replace function api_edge.billing_upsert_subscription(p_subscription jsonb)
returns void
language sql security definer set search_path = '' as $$
  insert into app.subscriptions (
    id, user_id, status, metadata, price_id, quantity, cancel_at_period_end,
    created, current_period_start, current_period_end, ended_at, cancel_at,
    canceled_at, trial_start, trial_end
  ) values (
    p_subscription->>'id', (p_subscription->>'user_id')::uuid,
    (p_subscription->>'status')::app.subscription_status, p_subscription->'metadata',
    p_subscription->>'price_id', (p_subscription->>'quantity')::integer,
    (p_subscription->>'cancel_at_period_end')::boolean,
    (p_subscription->>'created')::timestamptz,
    (p_subscription->>'current_period_start')::timestamptz,
    (p_subscription->>'current_period_end')::timestamptz,
    (p_subscription->>'ended_at')::timestamptz, (p_subscription->>'cancel_at')::timestamptz,
    (p_subscription->>'canceled_at')::timestamptz,
    (p_subscription->>'trial_start')::timestamptz, (p_subscription->>'trial_end')::timestamptz
  ) on conflict (id) do update set user_id = excluded.user_id, status = excluded.status,
    metadata = excluded.metadata, price_id = excluded.price_id, quantity = excluded.quantity,
    cancel_at_period_end = excluded.cancel_at_period_end, created = excluded.created,
    current_period_start = excluded.current_period_start,
    current_period_end = excluded.current_period_end, ended_at = excluded.ended_at,
    cancel_at = excluded.cancel_at, canceled_at = excluded.canceled_at,
    trial_start = excluded.trial_start, trial_end = excluded.trial_end;
$$;

create or replace function api_edge.billing_update_payment_method(
  p_user_id uuid, p_billing_address jsonb, p_payment_method jsonb
)
returns void
language sql security definer set search_path = '' as $$
  update app.customers set billing_address = p_billing_address, payment_method = p_payment_method
  where id = p_user_id;
$$;

create or replace function api_edge.billing_set_catalogue_item_inactive(p_kind text, p_id text)
returns void
language plpgsql security definer set search_path = '' as $$
begin
  if p_kind = 'product' then update app.products set active = false where id = p_id;
  elsif p_kind = 'price' then update app.prices set active = false where id = p_id;
  else raise exception 'Unsupported catalogue item kind' using errcode = '22023'; end if;
end;
$$;

create or replace function api_edge.accept_stripe_event(
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

create or replace function api_edge.claim_stripe_event(p_event_id text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_payload jsonb;
begin
  update app.stripe_events set status = 'processing', attempt_count = attempt_count + 1,
    processing_started_at = timezone('utc', now()), last_error = null
  where event_id = p_event_id and (
    (status in ('pending', 'failed') and next_attempt_at <= timezone('utc', now()))
    or (status = 'processing' and processing_started_at < timezone('utc', now()) - interval '5 minutes')
  );
  if not found then return null; end if;
  select payload into v_payload from app.stripe_event_payloads where event_id = p_event_id;
  return v_payload;
end;
$$;

create or replace function api_edge.complete_stripe_event(
  p_event_id text, p_error text default null, p_retry_at timestamptz default null
)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if p_error is null then
    update app.stripe_events set status = 'processed', processed_at = timezone('utc', now()),
      processing_started_at = null, last_error = null where event_id = p_event_id;
  else
    update app.stripe_events set status = 'failed', processing_started_at = null,
      next_attempt_at = coalesce(p_retry_at, timezone('utc', now()) + interval '1 minute'),
      last_error = left(p_error, 1000) where event_id = p_event_id;
  end if;
end;
$$;

create or replace function api_edge.list_claimable_stripe_events(p_limit integer default 20)
returns table (event_id text)
language sql security definer set search_path = '' as $$
  select e.event_id from app.stripe_events e
  where (e.status in ('pending', 'failed') and e.next_attempt_at <= timezone('utc', now()))
    or (e.status = 'processing' and e.processing_started_at < timezone('utc', now()) - interval '5 minutes')
  order by e.received_at limit least(greatest(coalesce(p_limit, 20), 1), 100);
$$;

revoke all on all functions in schema api_edge from public, anon, authenticated;
grant execute on all functions in schema api_edge to service_role;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'user-avatars', 'user-avatars', false, 5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy user_avatars_select_authenticated on storage.objects
  for select to authenticated
  using (
    bucket_id = 'user-avatars'
    and coalesce(((select auth.jwt()) ->> 'is_anonymous')::boolean, false) = false
  );
create policy user_avatars_insert_own on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'user-avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and coalesce(((select auth.jwt()) ->> 'is_anonymous')::boolean, false) = false
  );
create policy user_avatars_update_own on storage.objects
  for update to authenticated
  using (bucket_id = 'user-avatars' and (storage.foldername(name))[1] = (select auth.uid())::text)
  with check (bucket_id = 'user-avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy user_avatars_delete_own on storage.objects
  for delete to authenticated
  using (bucket_id = 'user-avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);

alter role authenticator set pgrst.db_schemas = 'graphql_public, api, api_edge';
notify pgrst, 'reload config';
notify pgrst, 'reload schema';

commit;
