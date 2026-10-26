-- One-time social defaults, independent of the application's onboarding policy.
-- Keep import state separate from public profile projections.
create table app.social_profile_imports (
  social_profile_import_id uuid primary key references auth.users(id) on delete cascade,
  profile_updated_at timestamptz,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);
alter table app.social_profile_imports enable row level security;
revoke all on app.social_profile_imports from public, anon, authenticated;

create function api.initialise_social_profile_by_current_user()
returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
  actor uuid := auth.uid();
  identity_metadata jsonb;
  identity_provider text;
  profile app.profiles%rowtype;
  inserted_id uuid;
  first_name_value text;
  last_name_value text;
  full_name_value text;
  avatar_value text;
begin
  if actor is null or coalesce((auth.jwt()->>'is_anonymous')::boolean, false) then
    raise exception 'Authentication required' using errcode = '42501';
  end if;
  select i.identity_data, i.provider into identity_metadata, identity_provider
  from auth.identities i
  where i.user_id = actor and i.provider not in ('email', 'phone')
  order by i.last_sign_in_at desc nulls last, i.created_at, i.id limit 1;
  if not found then return null; end if;

  -- Serialise with profile edits, and never overwrite an existing import marker.
  select p.* into profile from app.profiles p where p.id = actor for update;
  if not found then return null; end if;
  insert into app.social_profile_imports(social_profile_import_id)
  values (actor) on conflict do nothing returning social_profile_import_id into inserted_id;
  if inserted_id is null then return null; end if;

  -- Older edited profiles have no reliable field provenance: leave them alone.
  if profile.updated_at is distinct from profile.created_at then
    update app.social_profile_imports set completed_at = now() where social_profile_import_id = actor;
    return null;
  end if;

  select nullif(btrim(identity_metadata->>k), '') into first_name_value
  from unnest(array['first_name','given_name']) with ordinality as keys(k, n)
  where jsonb_typeof(identity_metadata->k) = 'string'
    and char_length(btrim(identity_metadata->>k)) between 1 and 100 order by n limit 1;
  select nullif(btrim(identity_metadata->>k), '') into last_name_value
  from unnest(array['last_name','family_name']) with ordinality as keys(k, n)
  where jsonb_typeof(identity_metadata->k) = 'string'
    and char_length(btrim(identity_metadata->>k)) between 1 and 100 order by n limit 1;
  select regexp_replace(btrim(identity_metadata->>k), '\s+', ' ', 'g') into full_name_value
  from unnest(array['full_name','name']) with ordinality as keys(k, n)
  where jsonb_typeof(identity_metadata->k) = 'string'
    and char_length(btrim(identity_metadata->>k)) between 1 and 201 order by n limit 1;
  -- Split only when neither structured name exists; never invent a surname.
  if first_name_value is null and last_name_value is null and full_name_value is not null then
    first_name_value := split_part(full_name_value, ' ', 1);
    last_name_value := nullif(btrim(substr(full_name_value, char_length(first_name_value) + 1)), '');
  end if;
  update app.profiles p set
    first_name = case when nullif(btrim(p.first_name), '') is null and char_length(first_name_value) <= 100 then first_name_value else p.first_name end,
    last_name = case when nullif(btrim(p.last_name), '') is null and char_length(last_name_value) <= 100 then last_name_value else p.last_name end
  where p.id = actor returning p.* into profile;

  select identity_metadata->>k into avatar_value
  from unnest(array['avatar_url','picture']) with ordinality as keys(k, n)
  where jsonb_typeof(identity_metadata->k) = 'string'
    and char_length(identity_metadata->>k) between 1 and 2048 order by n limit 1;
  update app.social_profile_imports set profile_updated_at = profile.updated_at,
    completed_at = case when profile.avatar_path is not null or avatar_value is null then now() else null end
  where social_profile_import_id = actor;
  if profile.avatar_path is not null or avatar_value is null then return null; end if;
  return jsonb_build_object('provider', identity_provider, 'avatar_url', avatar_value);
end;
$$;
revoke all on function api.initialise_social_profile_by_current_user() from public, anon;
grant execute on function api.initialise_social_profile_by_current_user() to authenticated;

create function api.complete_social_avatar_by_current_user(input_avatar_path text default null)
returns boolean
language plpgsql security definer set search_path = ''
as $$
declare
  actor uuid := auth.uid();
  profile app.profiles%rowtype;
  imported app.social_profile_imports%rowtype;
begin
  if actor is null or coalesce((auth.jwt()->>'is_anonymous')::boolean, false) then
    raise exception 'Authentication required' using errcode = '42501';
  end if;
  select p.* into profile from app.profiles p where p.id = actor for update;
  select s.* into imported from app.social_profile_imports s
  where s.social_profile_import_id = actor for update;
  if not found or imported.completed_at is not null then return false; end if;
  update app.social_profile_imports set completed_at = now() where social_profile_import_id = actor;
  if input_avatar_path is null then return false; end if;
  if imported.created_at < now() - interval '5 minutes'
    or profile.avatar_path is not null
    or profile.updated_at is distinct from imported.profile_updated_at then return false; end if;
  if char_length(input_avatar_path) > 512
    or input_avatar_path not like actor::text || '/avatar-%'
    or input_avatar_path ~ '(^|/)\.\.?(/|$)'
    or not exists (select 1 from storage.objects o where o.bucket_id = 'user-avatars'
      and o.name = input_avatar_path and o.owner_id = actor::text) then
    raise exception 'Invalid avatar path' using errcode = '22023';
  end if;
  update app.profiles p set avatar_path = input_avatar_path where p.id = actor;
  return true;
end;
$$;
revoke all on function api.complete_social_avatar_by_current_user(text) from public, anon;
grant execute on function api.complete_social_avatar_by_current_user(text) to authenticated;
notify pgrst, 'reload schema';
