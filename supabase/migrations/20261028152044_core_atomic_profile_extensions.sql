begin;

create schema if not exists internal;

alter table app.profiles add column if not exists profile_is_public boolean not null default false;

-- Applications replace these private hooks in their own forward migrations.
-- The writer runs inside the account update transaction and must validate every key.
create or replace function internal.get_account_profile_extension(account_id uuid)
returns jsonb language sql stable set search_path = '' as $$ select '{}'::jsonb $$;
create or replace function internal.update_account_profile_extension(account_id uuid, extension jsonb)
returns void language plpgsql set search_path = '' as $$
begin
  if extension <> '{}'::jsonb then
    raise exception 'Unsupported profile extension fields' using errcode = '22023';
  end if;
end;
$$;
revoke all on function internal.get_account_profile_extension(uuid) from public, anon, authenticated;
revoke all on function internal.update_account_profile_extension(uuid,jsonb) from public, anon, authenticated;

-- Some installed applications use profile_id; resolve the identifier at migration
-- time, so all generated queries retain indexed primary-key predicates.
do $migration$
declare profile_key text;
begin
  select a.attname into strict profile_key
  from pg_index i join pg_attribute a on a.attrelid=i.indrelid and a.attnum=any(i.indkey)
  where i.indrelid='app.profiles'::regclass and i.indisprimary;

  drop function api.get_account_profile_by_current_user();
  execute format($ddl$
    create function api.get_account_profile_by_current_user()
    returns table(%1$I uuid, first_name text, last_name text, username text, email text,
      avatar_path text, header_image_path text, language_code text, created_at timestamptz,
      updated_at timestamptz, profile_is_public boolean, extension jsonb)
    language sql stable security definer set search_path = '' as $body$
      select p.%1$I,p.first_name,p.last_name,p.username,p.email,p.avatar_path,
        p.header_image_path,p.language_code,p.created_at,p.updated_at,p.profile_is_public,
        internal.get_account_profile_extension(p.%1$I)
      from app.profiles p where p.%1$I=(select auth.uid())
        and not coalesce(((select auth.jwt())->>'is_anonymous')::boolean,false);
    $body$;
  $ddl$, profile_key);

  drop function api.update_account_profile_by_current_user(text,text,text);
  execute format($ddl$
    create function api.update_account_profile_by_current_user(request jsonb)
    returns void language plpgsql security definer set search_path = '' as $body$
    declare
      actor uuid := (select auth.uid());
      fields jsonb := coalesce(request->'profile','{}'::jsonb);
      extension_values jsonb := coalesce(request->'extension','{}'::jsonb);
      field text;
      value text;
    begin
      if actor is null or coalesce(((select auth.jwt())->>'is_anonymous')::boolean,false) then
        raise exception 'Account authentication required' using errcode='42501';
      end if;
      if request is null or jsonb_typeof(request)<>'object'
        or request - array['profile','extension'] <> '{}'::jsonb
        or jsonb_typeof(fields)<>'object' or jsonb_typeof(extension_values)<>'object'
        or fields - array['first_name','last_name','username','avatar_path','header_image_path','language_code','profile_is_public'] <> '{}'::jsonb then
        raise exception 'Invalid account profile request' using errcode='22023';
      end if;
      for field in select jsonb_object_keys(fields) loop
        if field='profile_is_public' then
          if jsonb_typeof(fields->field)<>'boolean' then
            raise exception 'Profile visibility must be boolean' using errcode='22023';
          end if;
        elsif field in ('first_name','last_name','language_code') then
          if jsonb_typeof(fields->field)<>'string' then
            raise exception 'Profile field must be a string' using errcode='22023';
          end if;
        elsif jsonb_typeof(fields->field) not in ('string','null') then
          raise exception 'Profile field must be a string or null' using errcode='22023';
        end if;
        value := nullif(btrim(fields->>field),'');
        if field in ('first_name','last_name') and (value is null or length(value)>100) then
          raise exception 'Names must contain 1 to 100 characters' using errcode='22023';
        elsif field='username' and value is not null and value !~ '^[A-Za-z0-9_-]{3,40}$' then
          raise exception 'Invalid username' using errcode='22023';
        elsif field='language_code' and (value is null or value !~ '^[a-z]{2}$') then
          raise exception 'Invalid language code' using errcode='22023';
        elsif field='avatar_path' and value is not null and
          (value not like actor::text || '/avatar-%%' or value ~ '(\.\.|[?#])') then
          raise exception 'Invalid avatar path' using errcode='22023';
        elsif field='header_image_path' and value is not null and
          (value not like actor::text || '/headers/header-%%' or value ~ '(\.\.|[?#])') then
          raise exception 'Invalid header path' using errcode='22023';
        end if;
      end loop;
      perform 1 from app.profiles p where p.%1$I=actor for update;
      if not found then raise exception 'Profile unavailable' using errcode='42501'; end if;
      if fields ? 'username' and exists(select 1 from app.profiles p
        where lower(p.username)=lower(nullif(btrim(fields->>'username'),'')) and p.%1$I<>actor) then
        raise exception 'Username is already in use' using errcode='23505';
      end if;
      update app.profiles p set
        first_name=case when fields?'first_name' then btrim(fields->>'first_name') else p.first_name end,
        last_name=case when fields?'last_name' then btrim(fields->>'last_name') else p.last_name end,
        username=case when fields?'username' then nullif(btrim(fields->>'username'),'') else p.username end,
        avatar_path=case when fields?'avatar_path' then nullif(btrim(fields->>'avatar_path'),'') else p.avatar_path end,
        header_image_path=case when fields?'header_image_path' then nullif(btrim(fields->>'header_image_path'),'') else p.header_image_path end,
        language_code=case when fields?'language_code' then btrim(fields->>'language_code') else p.language_code end,
        profile_is_public=case when fields?'profile_is_public' then (fields->>'profile_is_public')::boolean else p.profile_is_public end,
        updated_at=now()
      where p.%1$I=actor;
      perform internal.update_account_profile_extension(actor,extension_values);
    end;
    $body$;
  $ddl$, profile_key);

  execute format($ddl$
    create function api.get_public_account_profile(identifier text)
    returns jsonb language sql stable security definer set search_path = '' as $body$
      select jsonb_build_object('user_id',p.%1$I,'first_name',p.first_name,'last_name',p.last_name,
        'username',p.username,'avatar_path',p.avatar_path,'header_image_path',p.header_image_path)
      from app.profiles p where p.profile_is_public
        and (p.%1$I::text=identifier or lower(p.username)=lower(identifier)) limit 1;
    $body$;
  $ddl$, profile_key);
end;
$migration$;
revoke all on function api.get_account_profile_by_current_user() from public,anon,authenticated;
revoke all on function api.update_account_profile_by_current_user(jsonb) from public,anon,authenticated;
revoke all on function api.get_public_account_profile(text) from public,anon,authenticated;
grant execute on function api.get_account_profile_by_current_user() to authenticated;
grant execute on function api.update_account_profile_by_current_user(jsonb) to authenticated;
grant execute on function api.get_public_account_profile(text) to anon,authenticated;
-- Anonymous access is limited to the currently selected media of a public profile.
-- Authenticated application policies continue to govern member/organisation access.
drop policy if exists core_profile_media_public on storage.objects;
create policy core_profile_media_public on storage.objects for select to anon
using (bucket_id='user-avatars'
  and storage.allow_any_operation(array['object.get_authenticated','object.get_authenticated_info','object.head_authenticated_info'])
  and (name=api.get_public_account_profile(split_part(name,'/',1))->>'avatar_path'
    or name=api.get_public_account_profile(split_part(name,'/',1))->>'header_image_path'));

create table internal.profile_media_settings (
  profile_media_setting_id boolean primary key default true check(profile_media_setting_id),
  supabase_url text not null check(supabase_url ~ '^https?://[^/]+$')
);
revoke all on internal.profile_media_settings from public,anon,authenticated;
create function api.get_profile_media_url(object_path text)
returns text language sql stable security definer set search_path='' as $$
  select s.supabase_url || '/functions/v1/profile-media?path=' || object_path
  from internal.profile_media_settings s
  where object_path ~ '^[0-9a-f-]{36}/(avatar-[A-Za-z0-9_-]+|headers/header-[A-Za-z0-9_-]+)\.(webp|png|jpe?g|avif)$';
$$;
revoke all on function api.get_profile_media_url(text) from public,anon,authenticated;
grant execute on function api.get_profile_media_url(text) to anon,authenticated;
notify pgrst,'reload schema';
commit;
