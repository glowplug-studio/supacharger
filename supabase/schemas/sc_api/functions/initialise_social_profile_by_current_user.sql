CREATE OR REPLACE FUNCTION sc_api.initialise_social_profile_by_current_user()
  RETURNS jsonb
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
declare
  actor uuid := auth.uid();
  identity_metadata jsonb;
  identity_provider text;
  profile sc_app.profiles%rowtype;
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
  select p.* into profile from sc_app.profiles p where p.id = actor for update;
  if not found then return null; end if;
  insert into sc_app.social_profile_imports(social_profile_import_id)
  values (actor) on conflict do nothing returning social_profile_import_id into inserted_id;
  if inserted_id is null then return null; end if;

  -- Older edited profiles have no reliable field provenance: leave them alone.
  if profile.updated_at is distinct from profile.created_at then
    update sc_app.social_profile_imports set completed_at = now() where social_profile_import_id = actor;
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
  update sc_app.profiles p set
    first_name = case when nullif(btrim(p.first_name), '') is null and char_length(first_name_value) <= 100 then first_name_value else p.first_name end,
    last_name = case when nullif(btrim(p.last_name), '') is null and char_length(last_name_value) <= 100 then last_name_value else p.last_name end
  where p.id = actor returning p.* into profile;

  select identity_metadata->>k into avatar_value
  from unnest(array['avatar_url','picture']) with ordinality as keys(k, n)
  where jsonb_typeof(identity_metadata->k) = 'string'
    and char_length(identity_metadata->>k) between 1 and 2048 order by n limit 1;
  update sc_app.social_profile_imports set profile_updated_at = profile.updated_at,
    completed_at = case when profile.avatar_path is not null or avatar_value is null then now() else null end
  where social_profile_import_id = actor;
  if profile.avatar_path is not null or avatar_value is null then return null; end if;
  return jsonb_build_object('provider', identity_provider, 'avatar_url', avatar_value);
end;
$function$;

GRANT EXECUTE ON FUNCTION "sc_api"."initialise_social_profile_by_current_user"() TO "authenticated", "postgres";

REVOKE ALL ON FUNCTION "sc_api"."initialise_social_profile_by_current_user"() FROM PUBLIC;
