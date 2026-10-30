CREATE OR REPLACE FUNCTION sc_api.get_profile_media_url (
  object_path text
)
  RETURNS text
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
  select s.supabase_url || '/functions/v1/sc_profile-media?path=' || object_path
  from sc_internal.profile_media_settings s
  where object_path ~ '^[0-9a-f-]{36}/(avatar-[A-Za-z0-9_-]+|headers/header-[A-Za-z0-9_-]+)\.(webp|png|jpe?g|avif)$';
$function$;

GRANT EXECUTE ON FUNCTION "sc_api"."get_profile_media_url"(text) TO "anon", "authenticated", "postgres";

REVOKE ALL ON FUNCTION "sc_api"."get_profile_media_url"(text) FROM PUBLIC;
