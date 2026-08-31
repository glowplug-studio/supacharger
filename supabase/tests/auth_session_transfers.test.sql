begin;

create extension if not exists pgtap with schema extensions;
select extensions.plan(25);

insert into auth.users (id, email, aud, role, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values ('51000000-0000-0000-0000-000000000001', 'transfer@example.com', 'authenticated', 'authenticated', '{}', '{}', now(), now());

insert into auth.sessions (id, user_id, created_at, updated_at)
values ('52000000-0000-0000-0000-000000000001', '51000000-0000-0000-0000-000000000001', now(), now());

insert into auth.sessions (id, user_id, created_at, updated_at)
values ('52000000-0000-0000-0000-000000000002', '51000000-0000-0000-0000-000000000001', now(), now());

select extensions.has_table('app', 'auth_session_transfers', 'private transfer table exists');
select extensions.has_pk('app', 'auth_session_transfers', 'transfer table has a primary key');
select extensions.col_is_pk('app', 'auth_session_transfers', 'auth_session_transfer_id', 'primary key follows the naming contract');
select extensions.ok(
  (select class_record.relrowsecurity from pg_class class_record join pg_namespace namespace on namespace.oid = class_record.relnamespace where namespace.nspname = 'app' and class_record.relname = 'auth_session_transfers'),
  'RLS is enabled'
);
select extensions.ok(not has_table_privilege('anon', 'app.auth_session_transfers', 'SELECT'), 'anon cannot read transfers');
select extensions.ok(not has_table_privilege('authenticated', 'app.auth_session_transfers', 'SELECT'), 'authenticated cannot read transfers');
select extensions.ok(not has_function_privilege('anon', 'api_edge.create_auth_session_transfer(uuid,uuid,text,text,timestamptz)', 'EXECUTE'), 'anon cannot create transfers');
select extensions.ok(not has_function_privilege('authenticated', 'api_edge.claim_auth_session_transfer(text)', 'EXECUTE'), 'authenticated cannot claim transfers');
select extensions.ok(has_function_privilege('service_role', 'api_edge.create_auth_session_transfer(uuid,uuid,text,text,timestamptz)', 'EXECUTE'), 'service role can create transfers');
select extensions.ok(has_function_privilege('service_role', 'api_edge.claim_auth_session_transfer(text)', 'EXECUTE'), 'service role can claim transfers');

select * from api_edge.create_auth_session_transfer(
  '51000000-0000-0000-0000-000000000001',
  '52000000-0000-0000-0000-000000000001',
  repeat('a', 64),
  '/flotillas/example?tab=crew',
  statement_timestamp() + interval '2 minutes'
);

select extensions.is((select count(*)::integer from app.auth_session_transfers), 1, 'creation stores one grant');
select extensions.is((select token_hash from app.auth_session_transfers), repeat('a', 64), 'only the supplied digest is stored');
select extensions.is(
  (select claimed.user_id from api_edge.claim_auth_session_transfer(repeat('a', 64)) as claimed),
  '51000000-0000-0000-0000-000000000001'::uuid,
  'first atomic claim returns the expected user'
);
select extensions.is_empty(
  $$select * from api_edge.claim_auth_session_transfer(repeat('a', 64))$$,
  'a consumed grant cannot be replayed'
);

update app.auth_session_transfers set created_at = statement_timestamp() - interval '20 seconds';
select * from api_edge.create_auth_session_transfer(
  '51000000-0000-0000-0000-000000000001',
  '52000000-0000-0000-0000-000000000001',
  repeat('b', 64),
  '/',
  statement_timestamp() + interval '2 minutes'
);
update app.auth_session_transfers
set created_at = statement_timestamp() - interval '20 seconds'
where token_hash = repeat('b', 64);
update app.auth_session_transfers set expires_at = statement_timestamp() - interval '1 second' where token_hash = repeat('b', 64);
select extensions.is_empty(
  $$select * from api_edge.claim_auth_session_transfer(repeat('b', 64))$$,
  'an expired grant cannot be claimed'
);

update app.auth_session_transfers set created_at = statement_timestamp() - interval '20 seconds';
select * from api_edge.create_auth_session_transfer(
  '51000000-0000-0000-0000-000000000001',
  '52000000-0000-0000-0000-000000000001',
  repeat('c', 64),
  '/',
  statement_timestamp() + interval '2 minutes'
);
delete from auth.sessions where id = '52000000-0000-0000-0000-000000000001';
select extensions.is_empty(
  $$select * from api_edge.claim_auth_session_transfer(repeat('c', 64))$$,
  'source sign-out invalidates an unclaimed transfer'
);

select * from api_edge.create_auth_session_transfer(
  '51000000-0000-0000-0000-000000000001',
  '52000000-0000-0000-0000-000000000002',
  repeat('7', 64),
  '/',
  statement_timestamp() + interval '2 minutes'
);
update app.auth_session_transfers set created_at = statement_timestamp() - interval '20 seconds' where token_hash = repeat('7', 64);
select * from api_edge.create_auth_session_transfer(
  '51000000-0000-0000-0000-000000000001',
  '52000000-0000-0000-0000-000000000002',
  repeat('8', 64),
  '/',
  statement_timestamp() + interval '2 minutes'
);
select extensions.is((select count(*)::integer from app.auth_session_transfers where token_hash = repeat('7', 64)), 0, 'creation rotates the older unconsumed grant');
select extensions.is((select count(*)::integer from app.auth_session_transfers where token_hash = repeat('8', 64)), 1, 'rotation retains the new live grant');

insert into app.auth_session_transfers (user_id, source_session_id, token_hash, next_path, created_at, expires_at)
values (
  '51000000-0000-0000-0000-000000000001',
  '52000000-0000-0000-0000-000000000099',
  repeat('9', 64),
  '/',
  statement_timestamp() - interval '2 days',
  statement_timestamp() - interval '2 days' + interval '2 minutes'
);
update app.auth_session_transfers set created_at = statement_timestamp() - interval '20 seconds' where token_hash = repeat('8', 64);
select * from api_edge.create_auth_session_transfer(
  '51000000-0000-0000-0000-000000000001',
  '52000000-0000-0000-0000-000000000002',
  repeat('6', 64),
  '/',
  statement_timestamp() + interval '2 minutes'
);
select extensions.is((select count(*)::integer from app.auth_session_transfers where token_hash = repeat('9', 64)), 0, 'creation cleans up stale expired grants');
select extensions.is((select count(*)::integer from app.auth_session_transfers where token_hash = repeat('6', 64)), 1, 'cleanup retains the newly created live grant');

select extensions.throws_ok(
  $$select * from api_edge.create_auth_session_transfer('51000000-0000-0000-0000-000000000001','52000000-0000-0000-0000-000000000001',repeat('d',64),'/',statement_timestamp()+interval '2 minutes')$$,
  '28000',
  'auth_session_transfer_source_session_invalid',
  'creation requires a live matching source session'
);
select extensions.throws_ok(
  $$insert into app.auth_session_transfers(user_id,source_session_id,token_hash,next_path,expires_at) values ('51000000-0000-0000-0000-000000000001','52000000-0000-0000-0000-000000000001',repeat('e',64),'//outside.example',statement_timestamp()+interval '2 minutes')$$,
  '23514',
  null,
  'database rejects protocol-relative destinations'
);
select extensions.throws_ok(
  $$insert into app.auth_session_transfers(user_id,source_session_id,token_hash,next_path,expires_at) values ('51000000-0000-0000-0000-000000000001','52000000-0000-0000-0000-000000000001',repeat('f',64),'/',statement_timestamp()+interval '6 minutes')$$,
  '23514',
  null,
  'database enforces the five-minute maximum'
);
select extensions.is_empty(
  $$select * from api_edge.claim_auth_session_transfer(repeat('0', 64))$$,
  'an unknown digest returns no distinguishable state'
);
select extensions.ok(
  (select function_record.proconfig @> array['search_path=""'] from pg_proc function_record join pg_namespace namespace on namespace.oid = function_record.pronamespace where namespace.nspname = 'api_edge' and function_record.proname = 'claim_auth_session_transfer'),
  'claim uses an empty search path'
);

select * from extensions.finish();
rollback;
