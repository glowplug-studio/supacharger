begin;

create type app.organisation_role as enum ('owner', 'admin', 'member');

create table app.organisations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  handle text not null,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint organisations_name_not_blank check (btrim(name) <> ''),
  constraint organisations_handle_normalised check (
    handle = lower(btrim(handle))
    and handle ~ '^[a-z0-9][a-z0-9-]{1,62}[a-z0-9]$'
  )
);

create unique index organisations_handle_lower_key
  on app.organisations (lower(handle));

create table app.organisation_members (
  organisation_id uuid not null references app.organisations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role app.organisation_role not null default 'member',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  primary key (organisation_id, user_id)
);

create index organisation_members_user_id_idx
  on app.organisation_members (user_id);

create table app.user_session_contexts (
  session_id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  active_organisation_id uuid not null references app.organisations(id) on delete cascade,
  context_version bigint not null default 1,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index user_session_contexts_user_id_idx
  on app.user_session_contexts (user_id);

alter table app.organisations enable row level security;
alter table app.organisation_members enable row level security;
alter table app.user_session_contexts enable row level security;

revoke all on app.organisations, app.organisation_members, app.user_session_contexts
  from public, anon, authenticated;
grant all on app.organisations, app.organisation_members, app.user_session_contexts
  to service_role;
grant select on app.organisations, app.organisation_members, app.user_session_contexts
  to supabase_auth_admin;

create policy organisations_auth_hook_read on app.organisations
for select to supabase_auth_admin using (true);
create policy organisation_members_auth_hook_read on app.organisation_members
for select to supabase_auth_admin using (true);
create policy user_session_contexts_auth_hook_read on app.user_session_contexts
for select to supabase_auth_admin using (true);

create trigger organisations_touch_updated_at
before update on app.organisations
for each row execute function app.touch_updated_at();

create trigger organisation_members_touch_updated_at
before update on app.organisation_members
for each row execute function app.touch_updated_at();

create trigger user_session_contexts_touch_updated_at
before update on app.user_session_contexts
for each row execute function app.touch_updated_at();

create function app.normalise_organisation_handle(p_value text)
returns text
language sql
immutable
set search_path = ''
as $$
  select lower(regexp_replace(btrim(coalesce(p_value, '')), '[^a-zA-Z0-9-]+', '-', 'g'));
$$;

revoke all on function app.normalise_organisation_handle(text)
  from public, anon, authenticated;

create function api_edge.create_organisation_context(
  p_user_id uuid,
  p_session_id uuid,
  p_name text,
  p_handle text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_name text := btrim(coalesce(p_name, ''));
  v_handle text := app.normalise_organisation_handle(p_handle);
  v_organisation_id uuid;
begin
  if p_user_id is null or p_session_id is null then
    raise exception 'User and session are required' using errcode = '22023';
  end if;
  if v_name = '' or v_handle !~ '^[a-z0-9][a-z0-9-]{1,62}[a-z0-9]$' then
    raise exception 'Enter a name and a valid 3-64 character handle' using errcode = '22023';
  end if;

  insert into app.organisations (name, handle, created_by)
  values (v_name, v_handle, p_user_id)
  returning id into v_organisation_id;

  insert into app.organisation_members (organisation_id, user_id, role)
  values (v_organisation_id, p_user_id, 'owner');

  insert into app.user_session_contexts (session_id, user_id, active_organisation_id)
  values (p_session_id, p_user_id, v_organisation_id)
  on conflict (session_id) do update
    set user_id = excluded.user_id,
        active_organisation_id = excluded.active_organisation_id,
        context_version = app.user_session_contexts.context_version + 1;

  return jsonb_build_object('id', v_organisation_id, 'handle', v_handle);
end;
$$;

create function api_edge.select_organisation_context(
  p_user_id uuid,
  p_session_id uuid,
  p_handle text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_handle text := app.normalise_organisation_handle(p_handle);
  v_organisation_id uuid;
begin
  select org.id into v_organisation_id
  from app.organisations org
  join app.organisation_members member
    on member.organisation_id = org.id
   and member.user_id = p_user_id
  where lower(org.handle) = v_handle;

  if v_organisation_id is null then
    raise exception 'Organisation membership not found' using errcode = '42501';
  end if;

  insert into app.user_session_contexts (session_id, user_id, active_organisation_id)
  values (p_session_id, p_user_id, v_organisation_id)
  on conflict (session_id) do update
    set user_id = excluded.user_id,
        active_organisation_id = excluded.active_organisation_id,
        context_version = app.user_session_contexts.context_version + 1;

  return jsonb_build_object('id', v_organisation_id, 'handle', v_handle);
end;
$$;

revoke all on function api_edge.create_organisation_context(uuid, uuid, text, text)
  from public, anon, authenticated;
grant execute on function api_edge.create_organisation_context(uuid, uuid, text, text)
  to service_role;
revoke all on function api_edge.select_organisation_context(uuid, uuid, text)
  from public, anon, authenticated;
grant execute on function api_edge.select_organisation_context(uuid, uuid, text)
  to service_role;

create or replace function app.custom_access_token_hook(event jsonb)
returns jsonb
language plpgsql
stable
security invoker
set search_path = ''
as $$
declare
  claims jsonb := coalesce(event -> 'claims', '{}'::jsonb);
  assigned_role app.application_role;
  v_session_id uuid := nullif(claims ->> 'session_id', '')::uuid;
  v_organisation_id uuid;
  v_context_version bigint;
  v_handle text;
  v_organisation_role app.organisation_role;
begin
  select ur.role into assigned_role
  from app.user_roles ur
  where ur.user_id = (event ->> 'user_id')::uuid;

  claims := jsonb_set(
    claims,
    '{user_role}',
    to_jsonb(coalesce(assigned_role, 'user'::app.application_role)::text),
    true
  );

  if v_session_id is not null then
    select context.active_organisation_id, context.context_version, org.handle, member.role
    into v_organisation_id, v_context_version, v_handle, v_organisation_role
    from app.user_session_contexts context
    join app.organisations org on org.id = context.active_organisation_id
    join app.organisation_members member
      on member.organisation_id = context.active_organisation_id
     and member.user_id = context.user_id
    where context.session_id = v_session_id
      and context.user_id = (event ->> 'user_id')::uuid;
  end if;

  if v_organisation_id is null then
    claims := claims
      - 'active_organisation_id'
      - 'active_organisation_handle'
      - 'active_organisation_role'
      - 'organisation_context_version';
  else
    claims := jsonb_set(claims, '{active_organisation_id}', to_jsonb(v_organisation_id::text), true);
    claims := jsonb_set(claims, '{active_organisation_handle}', to_jsonb(v_handle), true);
    claims := jsonb_set(claims, '{active_organisation_role}', to_jsonb(v_organisation_role::text), true);
    claims := jsonb_set(claims, '{organisation_context_version}', to_jsonb(v_context_version), true);
  end if;

  return jsonb_set(event, '{claims}', claims, true);
end;
$$;

drop function api.is_profile_complete_by_current_user();
create function api.is_profile_complete_by_current_user(
  p_username_required boolean default false
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((
    select nullif(btrim(p.first_name), '') is not null
      and nullif(btrim(p.last_name), '') is not null
      and (
        not p_username_required
        or nullif(btrim(p.username), '') is not null
      )
    from app.profiles p
    where p.id = (select auth.uid())
      and coalesce(((select auth.jwt()) ->> 'is_anonymous')::boolean, false) = false
  ), false);
$$;

drop function api.update_account_profile_by_current_user(text, text, text);
create function api.update_account_profile_by_current_user(
  p_first_name text,
  p_last_name text,
  p_username text default null
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
  v_username text := nullif(btrim(coalesce(p_username, '')), '');
begin
  if v_user_id is null or coalesce(((select auth.jwt()) ->> 'is_anonymous')::boolean, false) then
    raise exception 'Verified account required' using errcode = '42501';
  end if;
  if char_length(v_first_name) not between 1 and 100
    or char_length(v_last_name) not between 1 and 100 then
    raise exception 'First and last names are required and must be at most 100 characters'
      using errcode = '22023';
  end if;
  if v_username is not null and v_username !~ '^[A-Za-z0-9_-]{3,40}$' then
    raise exception 'Username must be 3-40 letters, numbers, underscores, or hyphens'
      using errcode = '22023';
  end if;
  if v_username is not null and exists (
    select 1 from app.profiles p
    where lower(p.username) = lower(v_username) and p.id <> v_user_id
  ) then
    raise exception 'Username is already in use' using errcode = '23505';
  end if;
  update app.profiles
  set first_name = v_first_name,
      last_name = v_last_name,
      username = v_username
  where id = v_user_id;
end;
$$;

revoke all on function api.is_profile_complete_by_current_user(boolean)
  from public, anon, authenticated;
grant execute on function api.is_profile_complete_by_current_user(boolean)
  to authenticated;
revoke all on function api.update_account_profile_by_current_user(text, text, text)
  from public, anon, authenticated;
grant execute on function api.update_account_profile_by_current_user(text, text, text)
  to authenticated;

commit;
