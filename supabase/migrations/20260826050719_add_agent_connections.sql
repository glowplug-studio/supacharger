begin;

do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'supacharger_agent') then
    create role supacharger_agent nologin noinherit;
  end if;
end;
$$;

comment on role supacharger_agent is
  'Least-privilege OAuth role for Supacharger agent connections. Products grant only their explicit agent RPCs.';

grant supacharger_agent to authenticator;
grant usage on schema app to supacharger_agent;

create or replace function app.agent_connections_enabled()
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select false;
$$;

revoke all on function app.agent_connections_enabled()
from public, anon, authenticated, service_role, supacharger_agent;
grant execute on function app.agent_connections_enabled()
to authenticated, service_role, supabase_auth_admin, supacharger_agent;

comment on function app.agent_connections_enabled() is
  'Developer extension seam for the database-side agent-connections feature gate. Core defaults to disabled; an enabled product replaces it in a forward migration.';

create table app.agent_connections (
  agent_connection_id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references app.organisations(id) on delete cascade,
  authorised_user_id uuid not null references auth.users(id) on delete cascade,
  oauth_client_id text not null,
  oauth_client_name text not null,
  oauth_scopes text[] not null default '{}'::text[],
  created_at timestamptz not null default timezone('utc', now()),
  last_used_at timestamptz,
  revoked_at timestamptz,
  revoked_by uuid references auth.users(id) on delete set null,
  constraint agent_connections_client_id_not_blank
    check (btrim(oauth_client_id) <> '' and char_length(oauth_client_id) <= 255),
  constraint agent_connections_client_name_not_blank
    check (btrim(oauth_client_name) <> '' and char_length(oauth_client_name) <= 160),
  constraint agent_connections_scopes_bounded
    check (cardinality(oauth_scopes) <= 16),
  constraint agent_connections_revocation_consistent
    check ((revoked_at is null and revoked_by is null) or revoked_at is not null)
);

comment on table app.agent_connections is
  'Revocable organisation-scoped OAuth agent grants. Raw access and refresh tokens are never stored here.';

create unique index agent_connections_active_subject_client_key
  on app.agent_connections (organisation_id, authorised_user_id, oauth_client_id)
  where revoked_at is null;

create index agent_connections_authorised_user_idx
  on app.agent_connections (authorised_user_id, created_at desc);

create index agent_connections_organisation_idx
  on app.agent_connections (organisation_id, created_at desc);

alter table app.agent_connections enable row level security;
revoke all on table app.agent_connections
from public, anon, authenticated, service_role, supacharger_agent;
grant all on table app.agent_connections to service_role;

create or replace function app.agent_connection_extension(
  action text,
  target_agent_connection_id uuid,
  input_payload jsonb
)
returns jsonb
language plpgsql
volatile
security invoker
set search_path = ''
as $$
begin
  if target_agent_connection_id is null then
    raise exception 'Agent connection ID is required' using errcode = '22023';
  end if;
  if action = 'create'
    and coalesce(input_payload -> 'extension', '{}'::jsonb) <> '{}'::jsonb then
    raise exception 'Agent connection extensions are not configured'
      using errcode = '22023';
  end if;
  return '{}'::jsonb;
end;
$$;

revoke all on function app.agent_connection_extension(text, uuid, jsonb)
from public, anon, authenticated, service_role, supacharger_agent;

comment on function app.agent_connection_extension(text, uuid, jsonb) is
  'Developer-owned transactional extension seam for product resource bindings and safe list projections. Product replacements must re-authorise every input.';

create or replace function app.resolve_agent_connections()
returns table (
  agent_connection_id uuid,
  organisation_id uuid,
  authorised_user_id uuid,
  oauth_client_id text
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    connection.agent_connection_id,
    connection.organisation_id,
    connection.authorised_user_id,
    connection.oauth_client_id
  from app.agent_connections connection
  join app.organisation_members member
    on member.organisation_id = connection.organisation_id
   and member.user_id = connection.authorised_user_id
  where app.agent_connections_enabled()
    and (select auth.uid()) is not null
    and connection.authorised_user_id = (select auth.uid())
    and connection.oauth_client_id = nullif((select auth.jwt()) ->> 'client_id', '')
    and connection.revoked_at is null;
$$;

revoke all on function app.resolve_agent_connections()
from public, anon, authenticated, service_role;
grant execute on function app.resolve_agent_connections()
to supacharger_agent;

comment on function app.resolve_agent_connections() is
  'Returns only the calling OAuth subject/client live connections whose organisation membership still exists.';

create or replace function app.touch_agent_connection(
  target_agent_connection_id uuid
)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
begin
  update app.agent_connections connection
  set last_used_at = timezone('utc', now())
  where connection.agent_connection_id = target_agent_connection_id
    and connection.agent_connection_id in (
      select resolved.agent_connection_id
      from app.resolve_agent_connections() resolved
    );

  if not found then
    raise exception 'Agent connection not found or access denied'
      using errcode = '42501';
  end if;
end;
$$;

revoke all on function app.touch_agent_connection(uuid)
from public, anon, authenticated, service_role;
grant execute on function app.touch_agent_connection(uuid)
to supacharger_agent;

comment on function app.touch_agent_connection(uuid) is
  'Records successful use only after rechecking the calling OAuth subject, client, live grant and organisation membership.';

create function api.agent_connections(input_payload jsonb)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  requested_action text := lower(btrim(coalesce(input_payload ->> 'action', 'list')));
  requested_scope text := lower(btrim(coalesce(input_payload ->> 'scope', 'mine')));
  current_user_id uuid := (select auth.uid());
  target_organisation_id uuid := nullif(input_payload ->> 'organisationId', '')::uuid;
  target_connection_id uuid := nullif(input_payload ->> 'agentConnectionId', '')::uuid;
  actor_organisation_role app.organisation_role;
  target_connection app.agent_connections%rowtype;
  extension_result jsonb;
  normalised_scopes text[];
begin
  if not app.agent_connections_enabled() then
    raise exception 'Agent connections are disabled' using errcode = '42501';
  end if;
  if current_user_id is null
    or coalesce(((select auth.jwt()) ->> 'is_anonymous')::boolean, false)
    or nullif((select auth.jwt()) ->> 'client_id', '') is not null then
    raise exception 'A verified user session is required' using errcode = '28000';
  end if;
  if not exists (
    select 1 from auth.users auth_user
    where auth_user.id = current_user_id
      and auth_user.email_confirmed_at is not null
  ) then
    raise exception 'A verified user session is required' using errcode = '28000';
  end if;

  if requested_action = 'create' then
    if target_organisation_id is null then
      raise exception 'organisationId is required' using errcode = '22023';
    end if;
    if nullif(btrim(input_payload ->> 'oauthClientId'), '') is null
      or char_length(input_payload ->> 'oauthClientId') > 255 then
      raise exception 'A valid OAuth client ID is required' using errcode = '22023';
    end if;
    if nullif(btrim(input_payload ->> 'oauthClientName'), '') is null
      or char_length(input_payload ->> 'oauthClientName') > 160 then
      raise exception 'A valid OAuth client name is required' using errcode = '22023';
    end if;
    if jsonb_typeof(coalesce(input_payload -> 'oauthScopes', '[]'::jsonb)) <> 'array' then
      raise exception 'oauthScopes must be an array' using errcode = '22023';
    end if;

    select member.role into actor_organisation_role
    from app.organisation_members member
    where member.organisation_id = target_organisation_id
      and member.user_id = current_user_id;
    if actor_organisation_role is null then
      raise exception 'Organisation membership is required' using errcode = '42501';
    end if;

    select coalesce(array_agg(distinct btrim(scope_value)) filter (
      where btrim(scope_value) <> '' and char_length(btrim(scope_value)) <= 100
    ), '{}'::text[])
    into normalised_scopes
    from jsonb_array_elements_text(coalesce(input_payload -> 'oauthScopes', '[]'::jsonb)) scope(scope_value);
    if cardinality(normalised_scopes) > 16 then
      raise exception 'Too many OAuth scopes' using errcode = '22023';
    end if;

    insert into app.agent_connections (
      organisation_id,
      authorised_user_id,
      oauth_client_id,
      oauth_client_name,
      oauth_scopes
    ) values (
      target_organisation_id,
      current_user_id,
      btrim(input_payload ->> 'oauthClientId'),
      btrim(input_payload ->> 'oauthClientName'),
      normalised_scopes
    )
    returning * into target_connection;

    begin
      extension_result := app.agent_connection_extension(
        'create',
        target_connection.agent_connection_id,
        input_payload
      );
    exception when others then
      delete from app.agent_connections connection
      where connection.agent_connection_id = target_connection.agent_connection_id;
      raise;
    end;

    return jsonb_build_object(
      'agentConnectionId', target_connection.agent_connection_id,
      'organisationId', target_connection.organisation_id,
      'oauthClientId', target_connection.oauth_client_id,
      'oauthClientName', target_connection.oauth_client_name,
      'oauthScopes', to_jsonb(target_connection.oauth_scopes),
      'createdAt', target_connection.created_at,
      'extension', coalesce(extension_result, '{}'::jsonb)
    );
  end if;

  if requested_action = 'list' then
    if requested_scope not in ('mine', 'organisation') then
      raise exception 'Unsupported agent connection scope' using errcode = '22023';
    end if;
    if requested_scope = 'organisation' then
      if target_organisation_id is null then
        raise exception 'organisationId is required' using errcode = '22023';
      end if;
      select member.role into actor_organisation_role
      from app.organisation_members member
      where member.organisation_id = target_organisation_id
        and member.user_id = current_user_id;
      if actor_organisation_role is null then
        raise exception 'Organisation membership is required' using errcode = '42501';
      end if;
    end if;

    return jsonb_build_object(
      'scope', requested_scope,
      'canManageOrganisation', coalesce(actor_organisation_role in ('owner', 'admin'), false),
      'connections', coalesce((
        select jsonb_agg(
          jsonb_build_object(
            'agentConnectionId', connection.agent_connection_id,
            'organisationId', connection.organisation_id,
            'organisationName', organisation.name,
            'organisationHandle', organisation.handle,
            'authorisedUserId', connection.authorised_user_id,
            'authorisedFirstName', profile.first_name,
            'authorisedLastName', profile.last_name,
            'authorisedUsername', profile.username,
            'oauthClientId', connection.oauth_client_id,
            'oauthClientName', connection.oauth_client_name,
            'oauthScopes', to_jsonb(connection.oauth_scopes),
            'createdAt', connection.created_at,
            'lastUsedAt', connection.last_used_at,
            'revokedAt', connection.revoked_at,
            'isOwn', connection.authorised_user_id = current_user_id,
            'extension', coalesce(app.agent_connection_extension(
              'read', connection.agent_connection_id, '{}'::jsonb
            ), '{}'::jsonb)
          )
          order by (connection.revoked_at is null) desc, connection.created_at desc
        )
        from app.agent_connections connection
        join app.organisations organisation on organisation.id = connection.organisation_id
        left join app.profiles profile on profile.id = connection.authorised_user_id
        where (
          requested_scope = 'mine'
          and connection.authorised_user_id = current_user_id
        ) or (
          requested_scope = 'organisation'
          and connection.organisation_id = target_organisation_id
          and (
            actor_organisation_role in ('owner', 'admin')
            or connection.authorised_user_id = current_user_id
          )
        )
      ), '[]'::jsonb)
    );
  end if;

  if requested_action not in ('revoke', 'delete') or target_connection_id is null then
    raise exception 'Unsupported agent connection action' using errcode = '22023';
  end if;

  select connection.* into target_connection
  from app.agent_connections connection
  where connection.agent_connection_id = target_connection_id
  for update;
  if target_connection.agent_connection_id is null then
    raise exception 'Agent connection not found' using errcode = 'P0002';
  end if;

  select member.role into actor_organisation_role
  from app.organisation_members member
  where member.organisation_id = target_connection.organisation_id
    and member.user_id = current_user_id;
  if target_connection.authorised_user_id <> current_user_id
    and coalesce(actor_organisation_role::text, '') not in ('owner', 'admin') then
    raise exception 'Agent connection access denied' using errcode = '42501';
  end if;

  if requested_action = 'revoke' then
    if target_connection.revoked_at is null then
      update app.agent_connections connection
      set revoked_at = timezone('utc', now()), revoked_by = current_user_id
      where connection.agent_connection_id = target_connection_id;
      perform app.agent_connection_extension('revoke', target_connection_id, input_payload);
    end if;
    return jsonb_build_object(
      'agentConnectionId', target_connection_id,
      'oauthClientId', target_connection.oauth_client_id,
      'isOwn', target_connection.authorised_user_id = current_user_id,
      'revoked', true
    );
  end if;

  if target_connection.revoked_at is null then
    raise exception 'Revoke the agent connection before deleting it' using errcode = '55000';
  end if;
  perform app.agent_connection_extension('delete', target_connection_id, input_payload);
  delete from app.agent_connections connection
  where connection.agent_connection_id = target_connection_id;
  return jsonb_build_object('agentConnectionId', target_connection_id, 'deleted', true);
end;
$$;

revoke all on function api.agent_connections(jsonb)
from public, anon, supacharger_agent;
grant execute on function api.agent_connections(jsonb)
to authenticated;

comment on function api.agent_connections(jsonb) is
  'Creates and manages revocable OAuth agent connections. Organisation administrators see their organisation; other members see only their own connections.';

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
  if nullif(claims ->> 'client_id', '') is not null then
    claims := claims
      - 'user_role'
      - 'active_organisation_id'
      - 'active_organisation_handle'
      - 'active_organisation_role'
      - 'organisation_context_version';
    claims := jsonb_set(claims, '{role}', to_jsonb('supacharger_agent'::text), true);
    return jsonb_set(event, '{claims}', claims, true);
  end if;

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
from public, anon, authenticated, service_role, supacharger_agent;
grant execute on function app.custom_access_token_hook(jsonb)
to supabase_auth_admin;

comment on function app.custom_access_token_hook(jsonb) is
  'Issues OAuth clients under the generic least-privilege agent role; ordinary sessions retain canonical Core and validated product claims.';

drop function api.get_account_summary_by_current_user();

create function api.get_account_summary_by_current_user(
  include_organisations boolean default true
)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  with current_identity as (
    select (select auth.uid()) as user_id,
      nullif((select auth.jwt()) ->> 'session_id', '')::uuid as session_id
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
      'active_organisation', case when include_organisations then (
        select jsonb_build_object(
          'id', organisation.id,
          'handle', organisation.handle,
          'name', organisation.name,
          'role', member.role,
          'avatar_path', null
        )
        from app.user_session_contexts context
        join app.organisations organisation on organisation.id = context.active_organisation_id
        join app.organisation_members member
          on member.organisation_id = organisation.id
         and member.user_id = identity.user_id
        where context.session_id = identity.session_id
          and context.user_id = identity.user_id
      ) else null end,
      'organisation_count', case when include_organisations then (
        select count(*) from app.organisation_members member
        where member.user_id = identity.user_id
      ) else 0 end
    )
  end
  from current_identity identity
  join app.profiles profile on profile.id = identity.user_id;
$$;

revoke all on function api.get_account_summary_by_current_user(boolean)
from public, anon, supacharger_agent;
grant execute on function api.get_account_summary_by_current_user(boolean)
to authenticated;

comment on function api.get_account_summary_by_current_user(boolean) is
  'Returns account identity and optionally organisation context so disabled applications perform no organisation lookup.';

notify pgrst, 'reload schema';

commit;
