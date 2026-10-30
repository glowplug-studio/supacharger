CREATE OR REPLACE FUNCTION sc_api.check_account_username_available (
  input_username text
)
  RETURNS boolean
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
  select btrim(coalesce(input_username, '')) ~ '^[A-Za-z0-9_-]{3,40}$'
    and not exists (
      select 1 from sc_app.profiles p
      where lower(p.username) = lower(btrim(input_username))
        and p.id <> (select auth.uid())
    );
$function$;

GRANT EXECUTE ON FUNCTION "sc_api"."check_account_username_available"(text) TO "authenticated", "postgres";

REVOKE ALL ON FUNCTION "sc_api"."check_account_username_available"(text) FROM PUBLIC;
