CREATE OR REPLACE FUNCTION sc_api.get_account_profile_by_current_user()
  RETURNS TABLE (
    id                uuid,
    first_name        text,
    last_name         text,
    username          text,
    email             text,
    avatar_path       text,
    header_image_path text,
    language_code     text,
    created_at        timestamp with time zone,
    updated_at        timestamp with time zone,
    profile_is_public boolean,
    extension         jsonb
  )
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
      select p.id,p.first_name,p.last_name,p.username,p.email,p.avatar_path,
        p.header_image_path,p.language_code,p.created_at,p.updated_at,p.profile_is_public,
        sc_internal.get_account_profile_extension(p.id)
      from sc_app.profiles p where p.id=(select auth.uid())
        and not coalesce(((select auth.jwt())->>'is_anonymous')::boolean,false);
    $function$;

GRANT EXECUTE ON FUNCTION "sc_api"."get_account_profile_by_current_user"() TO "authenticated", "postgres";

REVOKE ALL ON FUNCTION "sc_api"."get_account_profile_by_current_user"() FROM PUBLIC;
