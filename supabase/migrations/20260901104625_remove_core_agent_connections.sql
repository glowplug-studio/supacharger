begin;

set local lock_timeout = '5s';
set local statement_timeout = '30s';

do $$
declare
  has_agent_connections boolean := false;
begin
  if to_regclass('app.agent_connections') is not null then
    execute 'select exists (select 1 from app.agent_connections)'
      into has_agent_connections;
  end if;

  if has_agent_connections then
    raise exception
      'Cannot remove Core agent connections while app.agent_connections contains rows'
      using errcode = '55000';
  end if;
end;
$$;

drop function if exists api.agent_connections(jsonb);
drop function if exists app.touch_agent_connection(uuid);
drop function if exists app.resolve_agent_connections();
drop function if exists app.agent_connection_extension(text, uuid, jsonb);
drop function if exists app.agent_connections_enabled();
drop table if exists app.agent_connections;

create or replace function app.custom_access_token_hook(event jsonb)
returns jsonb
language plpgsql
stable
security invoker
set search_path = ''
as $$
declare
  claims jsonb := coalesce(event -> 'claims', '{}'::jsonb);
  extension_claims jsonb;
  conflicting_claim text;
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

  extension_claims := coalesce(app.custom_access_token_claims_extension(event, claims), '{}'::jsonb);
  if jsonb_typeof(extension_claims) <> 'object' then
    raise exception 'custom_access_token_claims_extension must return a JSON object'
      using errcode = '22023';
  end if;

  select extension.key into conflicting_claim
  from jsonb_object_keys(extension_claims) as extension(key)
  where extension.key = any (array[
    'iss', 'aud', 'exp', 'iat', 'sub', 'role', 'aal', 'session_id',
    'email', 'phone', 'is_anonymous', 'jti', 'nbf', 'app_metadata',
    'user_metadata', 'amr', 'user_role', 'active_organisation_id',
    'active_organisation_handle', 'active_organisation_role',
    'organisation_context_version'
  ])
  limit 1;

  if conflicting_claim is not null then
    raise exception 'custom claim name "%" is reserved', conflicting_claim
      using errcode = '22023';
  end if;

  claims := claims || extension_claims;
  return jsonb_set(event, '{claims}', claims, true);
end;
$$;

revoke execute on function app.custom_access_token_hook(jsonb)
from public, anon, authenticated, service_role;
grant execute on function app.custom_access_token_hook(jsonb)
to supabase_auth_admin;

comment on function app.custom_access_token_hook(jsonb) is
  'Adds canonical role and active-organisation claims, then merges validated product claims from the developer extension seam.';

drop function if exists api.get_account_summary_by_current_user(boolean);

create or replace function api.get_account_summary_by_current_user()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  with current_identity as (
    select (select auth.uid()) as user_id,
      nullif((select auth.jwt()) ->> 'session_id', '')::uuid as session_id
  ), active_organisation as (
    select
      organisation.id,
      organisation.handle,
      organisation.name,
      member.role
    from current_identity identity
    join app.user_session_contexts context
      on context.session_id = identity.session_id
     and context.user_id = identity.user_id
    join app.organisations organisation
      on organisation.id = context.active_organisation_id
    join app.organisation_members member
      on member.organisation_id = organisation.id
     and member.user_id = identity.user_id
  )
  select case
    when identity.user_id is null
      or coalesce(((select auth.jwt()) ->> 'is_anonymous')::boolean, false)
      then null
    else jsonb_build_object(
      'user_id', profile.id,
      'email', profile.email,
      'first_name', profile.first_name,
      'last_name', profile.last_name,
      'username', profile.username,
      'avatar_path', profile.avatar_path,
      'active_organisation', (
        select jsonb_build_object(
          'id', organisation.id,
          'handle', organisation.handle,
          'name', organisation.name,
          'role', organisation.role,
          'avatar_path', null
        )
        from active_organisation organisation
      ),
      'organisation_count', (
        select count(*)
        from app.organisation_members member
        where member.user_id = identity.user_id
      )
    )
  end
  from current_identity identity
  join app.profiles profile on profile.id = identity.user_id;
$$;

revoke all on function api.get_account_summary_by_current_user()
  from public, anon;
grant execute on function api.get_account_summary_by_current_user()
  to authenticated;

comment on function api.get_account_summary_by_current_user() is
  'Returns the authenticated account identity and active organisation summary in one query. Media values are storage paths and must be signed by a trusted application boundary.';

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'supacharger_agent') then
    revoke supacharger_agent from authenticator;
    revoke usage on schema app from supacharger_agent;
    drop role supacharger_agent;
  end if;
end;
$$;

notify pgrst, 'reload schema';

commit;
