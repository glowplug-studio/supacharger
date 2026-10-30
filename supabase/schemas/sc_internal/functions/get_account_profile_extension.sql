CREATE OR REPLACE FUNCTION sc_internal.get_account_profile_extension (
  account_id uuid
)
  RETURNS jsonb
  LANGUAGE sql
  STABLE
  SET search_path TO ''
  AS $function$ select '{}'::jsonb $function$;

GRANT EXECUTE ON FUNCTION "sc_internal"."get_account_profile_extension"(uuid) TO "postgres";

REVOKE ALL ON FUNCTION "sc_internal"."get_account_profile_extension"(uuid) FROM PUBLIC;
