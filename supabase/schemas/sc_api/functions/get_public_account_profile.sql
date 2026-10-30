CREATE OR REPLACE FUNCTION sc_api.get_public_account_profile (
  identifier text
)
  RETURNS jsonb
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
      select jsonb_build_object('user_id',p.id,'first_name',p.first_name,'last_name',p.last_name,
        'username',p.username,'avatar_path',p.avatar_path,'header_image_path',p.header_image_path)
      from sc_app.profiles p where p.profile_is_public
        and (p.id::text=identifier or lower(p.username)=lower(identifier)) limit 1;
    $function$;

GRANT EXECUTE ON FUNCTION "sc_api"."get_public_account_profile"(text) TO "anon", "authenticated", "postgres";

REVOKE ALL ON FUNCTION "sc_api"."get_public_account_profile"(text) FROM PUBLIC;
