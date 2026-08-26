begin;

create extension if not exists pgtap with schema extensions;
select extensions.plan(17);

create or replace function app.agent_connections_enabled()
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$ select true; $$;

insert into auth.users (
  id, email, email_confirmed_at, aud, role, raw_app_meta_data,
  raw_user_meta_data, created_at, updated_at
)
values
  ('30000000-0000-0000-0000-000000000001', 'agent-owner@example.com', now(), 'authenticated', 'authenticated', '{}', '{}', now(), now()),
  ('30000000-0000-0000-0000-000000000002', 'agent-member@example.com', now(), 'authenticated', 'authenticated', '{}', '{}', now(), now());

select extensions.ok(
  exists (select 1 from pg_roles where rolname = 'supacharger_agent'),
  'the generic least-privilege agent role exists'
);
select extensions.ok(
  not has_function_privilege('anon', 'api.agent_connections(jsonb)', 'EXECUTE'),
  'anonymous callers cannot manage agent connections'
);
select extensions.ok(
  not has_function_privilege('supacharger_agent', 'api.agent_connections(jsonb)', 'EXECUTE'),
  'agent tokens cannot call the human management boundary'
);
select extensions.ok(
  has_function_privilege('authenticated', 'api.agent_connections(jsonb)', 'EXECUTE'),
  'verified human sessions can call the management boundary'
);

set local role authenticated;
select set_config('request.jwt.claims', jsonb_build_object(
  'sub', '30000000-0000-0000-0000-000000000001',
  'session_id', '31000000-0000-0000-0000-000000000001',
  'email', 'agent-owner@example.com',
  'is_anonymous', false
)::text, true);
select set_config(
  'test.agent_org_id',
  api.organisations('{"action":"create","name":"Agent Test Organisation","handle":"agent-test-org"}'::jsonb) ->> 'id',
  true
);
select api.organisations('{"action":"members.add","handle":"agent-test-org","userId":"30000000-0000-0000-0000-000000000002","role":"member"}'::jsonb);
select set_config(
  'test.owner_connection_id',
  api.agent_connections(jsonb_build_object(
    'action', 'create',
    'organisationId', current_setting('test.agent_org_id'),
    'oauthClientId', '40000000-0000-0000-0000-000000000001',
    'oauthClientName', 'Owner coding agent',
    'oauthScopes', jsonb_build_array('openid', 'email'),
    'extension', '{}'::jsonb
  )) ->> 'agentConnectionId',
  true
);

select extensions.ok(
  current_setting('test.owner_connection_id')::uuid is not null,
  'a verified member can create an organisation-scoped connection'
);
select extensions.is(
  jsonb_array_length(api.agent_connections('{"action":"list","scope":"mine"}'::jsonb) -> 'connections'),
  1,
  'a user can list their own connections'
);

set local role supacharger_agent;
select set_config('request.jwt.claims', jsonb_build_object(
  'sub', '30000000-0000-0000-0000-000000000001',
  'client_id', '40000000-0000-0000-0000-000000000001',
  'role', 'supacharger_agent'
)::text, true);
select set_config(
  'test.resolved_count',
  (select count(*)::text from app.resolve_agent_connections()),
  true
);
reset role;
select extensions.is(
  current_setting('test.resolved_count')::integer,
  1,
  'an agent resolves only its live subject and OAuth client connection'
);
set local role supacharger_agent;
select set_config('request.jwt.claims', jsonb_build_object(
  'sub', '30000000-0000-0000-0000-000000000001',
  'client_id', '40000000-0000-0000-0000-000000000099',
  'role', 'supacharger_agent'
)::text, true);
select set_config(
  'test.resolved_count',
  (select count(*)::text from app.resolve_agent_connections()),
  true
);
reset role;
select extensions.is(
  current_setting('test.resolved_count')::integer,
  0,
  'a different OAuth client cannot reuse the connection'
);

set local role authenticated;
select set_config('request.jwt.claims', jsonb_build_object(
  'sub', '30000000-0000-0000-0000-000000000002',
  'session_id', '31000000-0000-0000-0000-000000000002',
  'email', 'agent-member@example.com',
  'is_anonymous', false
)::text, true);
select set_config(
  'test.member_connection_id',
  api.agent_connections(jsonb_build_object(
    'action', 'create',
    'organisationId', current_setting('test.agent_org_id'),
    'oauthClientId', '40000000-0000-0000-0000-000000000002',
    'oauthClientName', 'Member coding agent',
    'oauthScopes', jsonb_build_array('openid'),
    'extension', '{}'::jsonb
  )) ->> 'agentConnectionId',
  true
);
select extensions.is(
  jsonb_array_length(api.agent_connections(jsonb_build_object(
    'action', 'list', 'scope', 'organisation',
    'organisationId', current_setting('test.agent_org_id')
  )) -> 'connections'),
  1,
  'a non-administrator sees only their own organisation connections'
);
select extensions.throws_ok(
  format(
    'select api.agent_connections(%L::jsonb)',
    jsonb_build_object('action', 'revoke', 'agentConnectionId', current_setting('test.owner_connection_id'))::text
  ),
  '42501',
  'Agent connection access denied',
  'a member cannot revoke another user connection'
);

set local role authenticated;
select set_config('request.jwt.claims', jsonb_build_object(
  'sub', '30000000-0000-0000-0000-000000000001',
  'session_id', '31000000-0000-0000-0000-000000000001',
  'email', 'agent-owner@example.com',
  'is_anonymous', false
)::text, true);
select extensions.is(
  jsonb_array_length(api.agent_connections(jsonb_build_object(
    'action', 'list', 'scope', 'organisation',
    'organisationId', current_setting('test.agent_org_id')
  )) -> 'connections'),
  2,
  'an organisation owner sees every organisation connection'
);
select extensions.is(
  api.agent_connections(jsonb_build_object(
    'action', 'list', 'scope', 'organisation',
    'organisationId', current_setting('test.agent_org_id')
  )) ->> 'canManageOrganisation',
  'true',
  'the organisation response identifies administrative management authority'
);
select extensions.is(
  api.agent_connections(jsonb_build_object(
    'action', 'revoke',
    'agentConnectionId', current_setting('test.member_connection_id')
  )) ->> 'revoked',
  'true',
  'an organisation owner can revoke a member connection immediately'
);

set local role supacharger_agent;
select set_config('request.jwt.claims', jsonb_build_object(
  'sub', '30000000-0000-0000-0000-000000000002',
  'client_id', '40000000-0000-0000-0000-000000000002',
  'role', 'supacharger_agent'
)::text, true);
select set_config(
  'test.resolved_count',
  (select count(*)::text from app.resolve_agent_connections()),
  true
);
reset role;
select extensions.is(
  current_setting('test.resolved_count')::integer,
  0,
  'a revoked connection loses database access immediately'
);

select extensions.is(
  app.custom_access_token_hook(jsonb_build_object(
    'user_id', '30000000-0000-0000-0000-000000000001',
    'claims', jsonb_build_object(
      'client_id', '40000000-0000-0000-0000-000000000001',
      'role', 'authenticated',
      'user_role', 'admin',
      'active_organisation_id', current_setting('test.agent_org_id')
    )
  )) -> 'claims' ->> 'role',
  'supacharger_agent',
  'OAuth access tokens receive the generic agent role'
);
select extensions.ok(
  not (app.custom_access_token_hook(jsonb_build_object(
    'user_id', '30000000-0000-0000-0000-000000000001',
    'claims', jsonb_build_object(
      'client_id', '40000000-0000-0000-0000-000000000001',
      'role', 'authenticated',
      'active_organisation_id', current_setting('test.agent_org_id')
    )
  )) -> 'claims' ? 'active_organisation_id'),
  'OAuth access tokens do not inherit the human organisation claim'
);

create or replace function app.agent_connections_enabled()
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$ select false; $$;
set local role authenticated;
select set_config('request.jwt.claims', jsonb_build_object(
  'sub', '30000000-0000-0000-0000-000000000001',
  'is_anonymous', false
)::text, true);
select extensions.throws_ok(
  $$select api.agent_connections('{"action":"list","scope":"mine"}'::jsonb)$$,
  '42501',
  'Agent connections are disabled',
  'the database feature gate blocks management when disabled'
);

select * from extensions.finish();
rollback;
