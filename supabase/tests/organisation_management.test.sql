begin;

create extension if not exists pgtap with schema extensions;
select extensions.plan(27);

insert into auth.users (id, email, aud, role, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values
  ('10000000-0000-0000-0000-000000000001', 'owner@example.com', 'authenticated', 'authenticated', '{}', '{}', now(), now()),
  ('10000000-0000-0000-0000-000000000002', 'invited@example.com', 'authenticated', 'authenticated', '{}', '{}', now(), now()),
  ('10000000-0000-0000-0000-000000000003', 'member@example.com', 'authenticated', 'authenticated', '{}', '{}', now(), now()),
  ('10000000-0000-0000-0000-000000000004', 'requester@example.com', 'authenticated', 'authenticated', '{}', '{}', now(), now()),
  ('10000000-0000-0000-0000-000000000005', 'expired@example.com', 'authenticated', 'authenticated', '{}', '{}', now(), now());

set local role authenticated;
select set_config('request.jwt.claims', jsonb_build_object(
  'sub', '10000000-0000-0000-0000-000000000001',
  'session_id', '20000000-0000-0000-0000-000000000001',
  'email', 'owner@example.com',
  'is_anonymous', false
)::text, true);

select extensions.is(
  api.organisations('{"action":"create","name":"Example Organisation","handle":"example-org"}'::jsonb) ->> 'role',
  'owner',
  'create makes the current user an owner'
);
select extensions.is(
  jsonb_array_length(api.organisations('{"action":"list"}'::jsonb) -> 'organisations'),
  1,
  'list returns only current-user organisations'
);
select extensions.is(
  api.organisations('{"action":"handle.available","handle":"account"}'::jsonb) ->> 'available',
  'false',
  'reserved root handles are unavailable'
);
select extensions.throws_ok(
  $$select api.organisations('{"action":"create","name":"Reserved","handle":"account"}'::jsonb)$$,
  '23514',
  'Organisation handle is reserved',
  'reserved root handles cannot be created'
);
select extensions.ok(
  (api.organisations('{"action":"switch","handle":"example-org"}'::jsonb) ->> 'requiresSessionRefresh')::boolean,
  'switch tells the client to refresh its session'
);
select extensions.is(
  api.organisations('{"action":"update","handle":"example-org","bio":"Shared starter workspace","colourHex":"#123ABC","accessPolicy":"request"}'::jsonb) ->> 'bio',
  'Shared starter workspace',
  'organisation profile fields update through the authenticated boundary'
);

select set_config(
  'test.invite_token',
  api.organisations('{"action":"invites.create","handle":"example-org","email":"  INVITED@EXAMPLE.COM  ","role":"admin"}'::jsonb) ->> 'inviteToken',
  true
);

reset role;
select extensions.is(
  (select invitation.email from app.organisation_invitations invitation where invitation.email = 'invited@example.com'),
  'invited@example.com',
  'invitation email is normalised'
);
select extensions.ok(
  (select invitation.token_hash <> current_setting('test.invite_token') and char_length(invitation.token_hash) = 64
   from app.organisation_invitations invitation where invitation.email = 'invited@example.com'),
  'only the invitation token hash is stored'
);

set local role authenticated;
select set_config('request.jwt.claims', jsonb_build_object(
  'sub', '10000000-0000-0000-0000-000000000002',
  'session_id', '20000000-0000-0000-0000-000000000002',
  'email', 'invited@example.com',
  'is_anonymous', false
)::text, true);
select extensions.is(
  api.organisations(jsonb_build_object('action', 'invites.accept', 'token', current_setting('test.invite_token'))) ->> 'role',
  'admin',
  'the invited account can accept an unexpired invitation'
);
select extensions.throws_ok(
  format('select api.organisations(%L::jsonb)', jsonb_build_object('action', 'invites.accept', 'token', current_setting('test.invite_token'))::text),
  'P0002',
  'Invitation not found, expired, revoked, or already used',
  'an invitation cannot be replayed'
);

select extensions.throws_ok(
  $$select api.organisations('{"action":"members.add","handle":"example-org","userId":"10000000-0000-0000-0000-000000000003","role":"admin"}'::jsonb)$$,
  '42501',
  'Only owners can add organisation administrators',
  'administrators cannot create other administrators'
);

select set_config('request.jwt.claims', jsonb_build_object(
  'sub', '10000000-0000-0000-0000-000000000001',
  'session_id', '20000000-0000-0000-0000-000000000001',
  'email', 'owner@example.com',
  'is_anonymous', false
)::text, true);
select extensions.lives_ok(
  $$select api.organisations('{"action":"members.add","handle":"example-org","userId":"10000000-0000-0000-0000-000000000003","role":"member"}'::jsonb)$$,
  'an owner can add a member'
);
select extensions.throws_ok(
  $$select api.organisations('{"action":"members.updateRole","handle":"example-org","userId":"10000000-0000-0000-0000-000000000001","role":"member"}'::jsonb)$$,
  '23514',
  'Cannot demote the last owner',
  'the last owner cannot be demoted'
);

select set_config('request.jwt.claims', jsonb_build_object(
  'sub', '10000000-0000-0000-0000-000000000004',
  'session_id', '20000000-0000-0000-0000-000000000004',
  'email', 'requester@example.com',
  'is_anonymous', false
)::text, true);
select extensions.is(
  api.organisations('{"action":"access.request","handle":"example-org"}'::jsonb) ->> 'status',
  'pending',
  'request access is available only after the organisation opts in'
);

reset role;
select extensions.is(
  (select request.status::text from app.organisation_access_requests request
   where request.requested_by = '10000000-0000-0000-0000-000000000004'),
  'pending',
  'access request is persisted for manager review'
);
select set_config(
  'test.access_request_id',
  (select request.id::text from app.organisation_access_requests request
   where request.requested_by = '10000000-0000-0000-0000-000000000004'),
  true
);

set local role authenticated;
select set_config('request.jwt.claims', jsonb_build_object(
  'sub', '10000000-0000-0000-0000-000000000001',
  'session_id', '20000000-0000-0000-0000-000000000001',
  'email', 'owner@example.com',
  'is_anonymous', false
)::text, true);
select extensions.lives_ok(
  format('select api.organisations(%L::jsonb)', jsonb_build_object(
    'action', 'access.approve',
    'handle', 'example-org',
    'requestId', current_setting('test.access_request_id')
  )::text),
  'an owner can approve a pending access request'
);

reset role;
select extensions.ok(
  exists (select 1 from app.organisation_members member
    where member.organisation_id = (select organisation.id from app.organisations organisation where organisation.handle = 'example-org')
      and member.user_id = '10000000-0000-0000-0000-000000000004'
      and member.role = 'member'),
  'approval creates a member role'
);
select extensions.ok(
  exists (select 1 from app.billing_accounts account
    where account.subject_type = 'organisation'
      and account.subject_id = (select organisation.id from app.organisations organisation where organisation.handle = 'example-org')),
  'organisation creation binds a billing account'
);
select extensions.is(
  (select count(*)::integer from app.billing_account_members billing_member
   join app.billing_accounts account on account.id = billing_member.billing_account_id
   where account.subject_type = 'organisation'
     and account.subject_id = (select organisation.id from app.organisations organisation where organisation.handle = 'example-org')),
  4,
  'organisation billing membership follows organisation membership'
);
select extensions.is(
  (select bucket.file_size_limit::bigint from storage.buckets bucket where bucket.id = 'organisation-logos'),
  5242880::bigint,
  'organisation media bucket enforces a five-megabyte limit'
);
select extensions.is(
  (select count(*)::integer from pg_policies policy
   where policy.schemaname = 'storage' and policy.tablename = 'objects'
     and policy.policyname like 'organisation_logos_%'),
  4,
  'organisation media has member read and manager mutation policies'
);

set local role authenticated;
select set_config('request.jwt.claims', jsonb_build_object(
  'sub', '10000000-0000-0000-0000-000000000001',
  'session_id', '20000000-0000-0000-0000-000000000001',
  'email', 'owner@example.com',
  'is_anonymous', false
)::text, true);
select set_config(
  'test.expired_token',
  api.organisations('{"action":"invites.create","handle":"example-org","email":"expired@example.com","role":"member"}'::jsonb) ->> 'inviteToken',
  true
);
reset role;
update app.organisation_invitations invitation
set expires_at = now() - interval '1 minute'
where invitation.email = 'expired@example.com';

set local role authenticated;
select set_config('request.jwt.claims', jsonb_build_object(
  'sub', '10000000-0000-0000-0000-000000000005',
  'session_id', '20000000-0000-0000-0000-000000000005',
  'email', 'expired@example.com',
  'is_anonymous', false
)::text, true);
select extensions.throws_ok(
  format('select api.organisations(%L::jsonb)', jsonb_build_object('action', 'invites.accept', 'token', current_setting('test.expired_token'))::text),
  'P0002',
  'Invitation not found, expired, revoked, or already used',
  'expired invitations are rejected'
);

select extensions.throws_ok(
  $$select api.organisations('{"action":"read","handle":"missing-org"}'::jsonb)$$,
  'P0002',
  'Organisation not found',
  'an unknown organisation is not disclosed'
);

reset role;
select extensions.ok(
  not has_function_privilege('anon', 'api.organisations(jsonb)', 'EXECUTE'),
  'anonymous callers cannot execute the organisation boundary'
);
select extensions.ok(
  not exists (
    select 1
    from pg_proc function_record
    join pg_namespace namespace on namespace.oid = function_record.pronamespace
    cross join lateral unnest(coalesce(function_record.proargnames, array[]::text[])) with ordinality argument(name, position)
    where namespace.nspname in ('api', 'api_edge')
      and argument.position <= function_record.pronargs
      and argument.name like 'p\_%' escape '\'
  ),
  'exposed routine argument names do not use the legacy p_ prefix'
);
select extensions.ok(
  exists (select 1 from app.user_session_contexts context
    where context.user_id = '10000000-0000-0000-0000-000000000002'
      and context.context_version >= 1),
  'context selection records the JWT context version'
);
select extensions.ok(
  (select organisation.avatar_path is null and organisation.header_image_path is null
   from app.organisations organisation where organisation.handle = 'example-org'),
  'organisation media paths remain nullable and constrained'
);

select * from extensions.finish();
rollback;
