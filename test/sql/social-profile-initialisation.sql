-- Run against an aligned local database. Every fixture is rolled back.
begin;
insert into auth.users (id, email, raw_user_meta_data, created_at, updated_at)
values ('d7e564ea-5266-4b30-a25d-274e365135c1', 'social-import-test@example.invalid',
  '{"username":"social_import_fixture"}', now(), now());
insert into auth.identities (user_id, provider_id, provider, identity_data, created_at, updated_at)
values ('d7e564ea-5266-4b30-a25d-274e365135c1','social-import-fixture','google',
  '{"given_name":"Ada","family_name":"Lovelace","avatar_url":"https://lh3.googleusercontent.com/test"}', now(), now());
select set_config('request.jwt.claims', '{"sub":"d7e564ea-5266-4b30-a25d-274e365135c1","role":"authenticated","is_anonymous":false}', true);
set local role authenticated;
do $$
declare result jsonb;
begin
  result := api.initialise_social_profile_by_current_user();
  if result->>'provider' is distinct from 'google' then raise exception 'Missing import source'; end if;
  if api.initialise_social_profile_by_current_user() is not null then raise exception 'Import was not one-time'; end if;
  if api.complete_social_avatar_by_current_user() then raise exception 'Empty avatar accepted'; end if;
end;
$$;
reset role;
do $$
begin
  if not exists(select 1 from app.profiles where id='d7e564ea-5266-4b30-a25d-274e365135c1'
    and first_name='Ada' and last_name='Lovelace' and avatar_path is null) then raise exception 'Names not seeded'; end if;
end;
$$;
-- A valid, owned stored image is attached once. Cross-user paths are rejected.
update app.profiles set created_at=now(), first_name='', last_name=''
where id='d7e564ea-5266-4b30-a25d-274e365135c1';
delete from app.social_profile_imports where social_profile_import_id='d7e564ea-5266-4b30-a25d-274e365135c1';
update auth.identities set identity_data='{"name":"Grace Brewster Murray Hopper","picture":"https://lh3.googleusercontent.com/test"}'
where user_id='d7e564ea-5266-4b30-a25d-274e365135c1';
insert into storage.objects(bucket_id,name,owner_id)
values ('user-avatars','d7e564ea-5266-4b30-a25d-274e365135c1/avatar-fixture.jpg','d7e564ea-5266-4b30-a25d-274e365135c1');
set local role authenticated;
do $$ begin
  perform api.initialise_social_profile_by_current_user();
  begin perform api.complete_social_avatar_by_current_user('00000000-0000-0000-0000-000000000000/avatar-other.jpg');
    raise exception 'Foreign path accepted';
  exception when invalid_parameter_value then null; end;
  if not api.complete_social_avatar_by_current_user('d7e564ea-5266-4b30-a25d-274e365135c1/avatar-fixture.jpg') then
    raise exception 'Owned image rejected'; end if;
  if api.complete_social_avatar_by_current_user('d7e564ea-5266-4b30-a25d-274e365135c1/avatar-fixture.jpg') then
    raise exception 'Repeated completion accepted'; end if;
end; $$;
reset role;
do $$ begin
  if not exists(select 1 from app.profiles where id='d7e564ea-5266-4b30-a25d-274e365135c1'
    and first_name='Grace' and last_name='Brewster Murray Hopper' and avatar_path is not null) then
    raise exception 'Fallback name or avatar missing'; end if;
end; $$;
update app.profiles set avatar_path=null where id='d7e564ea-5266-4b30-a25d-274e365135c1';
set local role authenticated;
do $$ begin
  if api.initialise_social_profile_by_current_user() is not null then raise exception 'Removed image reimported'; end if;
end; $$;
reset role;
-- Existing edits prevent import, even when a field was deliberately cleared.
update app.profiles set first_name='Edited', last_name='', created_at=now()-interval '1 day'
where id='d7e564ea-5266-4b30-a25d-274e365135c1';
set local role authenticated;
do $$ begin
  if api.initialise_social_profile_by_current_user() is not null then raise exception 'Edited profile imported'; end if;
end; $$;
reset role;
do $$ begin
  if not exists(select 1 from app.profiles where id='d7e564ea-5266-4b30-a25d-274e365135c1'
    and first_name='Edited' and last_name='') then raise exception 'Edits overwritten'; end if;
end; $$;
-- An explicit removal wins even within the same transaction/timestamp.
update app.profiles set created_at=now(), avatar_path=null where id='d7e564ea-5266-4b30-a25d-274e365135c1';
delete from app.social_profile_imports where social_profile_import_id='d7e564ea-5266-4b30-a25d-274e365135c1';
set local role authenticated;
select api.initialise_social_profile_by_current_user();
reset role;
update app.profiles set avatar_path=null where id='d7e564ea-5266-4b30-a25d-274e365135c1';
set local role authenticated;
do $$ begin
  if api.complete_social_avatar_by_current_user('d7e564ea-5266-4b30-a25d-274e365135c1/avatar-fixture.jpg') then
    raise exception 'Concurrent removal lost'; end if;
end; $$;
reset role;
-- Anonymous identities cannot call either routine.
select set_config('request.jwt.claims', '{"sub":"d7e564ea-5266-4b30-a25d-274e365135c1","role":"authenticated","is_anonymous":true}', true);
set local role authenticated;
do $$ begin
  begin perform api.initialise_social_profile_by_current_user(); raise exception 'Anonymous import allowed';
  exception when insufficient_privilege then null; end;
  begin perform api.complete_social_avatar_by_current_user(); raise exception 'Anonymous completion allowed';
  exception when insufficient_privilege then null; end;
end; $$;
rollback;
