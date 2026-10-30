CREATE OR REPLACE FUNCTION sc_api.update_account_profile_by_current_user (
  request jsonb
)
  RETURNS void
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
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
          (value not like actor::text || '/avatar-%' or value ~ '(\.\.|[?#])') then
          raise exception 'Invalid avatar path' using errcode='22023';
        elsif field='header_image_path' and value is not null and
          (value not like actor::text || '/headers/header-%' or value ~ '(\.\.|[?#])') then
          raise exception 'Invalid header path' using errcode='22023';
        end if;
      end loop;
      perform 1 from sc_app.profiles p where p.id=actor for update;
      if not found then raise exception 'Profile unavailable' using errcode='42501'; end if;
      if fields ? 'username' and exists(select 1 from sc_app.profiles p
        where lower(p.username)=lower(nullif(btrim(fields->>'username'),'')) and p.id<>actor) then
        raise exception 'Username is already in use' using errcode='23505';
      end if;
      update sc_app.profiles p set
        first_name=case when fields?'first_name' then btrim(fields->>'first_name') else p.first_name end,
        last_name=case when fields?'last_name' then btrim(fields->>'last_name') else p.last_name end,
        username=case when fields?'username' then nullif(btrim(fields->>'username'),'') else p.username end,
        avatar_path=case when fields?'avatar_path' then nullif(btrim(fields->>'avatar_path'),'') else p.avatar_path end,
        header_image_path=case when fields?'header_image_path' then nullif(btrim(fields->>'header_image_path'),'') else p.header_image_path end,
        language_code=case when fields?'language_code' then btrim(fields->>'language_code') else p.language_code end,
        profile_is_public=case when fields?'profile_is_public' then (fields->>'profile_is_public')::boolean else p.profile_is_public end,
        updated_at=now()
      where p.id=actor;
      perform sc_internal.update_account_profile_extension(actor,extension_values);
    end;
    $function$;

GRANT EXECUTE ON FUNCTION "sc_api"."update_account_profile_by_current_user"(jsonb) TO "authenticated", "postgres";

REVOKE ALL ON FUNCTION "sc_api"."update_account_profile_by_current_user"(jsonb) FROM PUBLIC;
