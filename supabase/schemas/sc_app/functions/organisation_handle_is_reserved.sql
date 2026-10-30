CREATE OR REPLACE FUNCTION sc_app.organisation_handle_is_reserved (
  value text
)
  RETURNS boolean
  LANGUAGE sql
  IMMUTABLE
  SET search_path TO ''
  AS $function$
  select lower(btrim(coalesce($1, ''))) = any(array[
    'account', 'api', 'auth', 'en', 'fr', 'organisation', 'organisations',
    'pricing', 'settings', 'static', 'subscribe'
  ]::text[]);
$function$;

GRANT EXECUTE ON FUNCTION "sc_app"."organisation_handle_is_reserved"(text) TO "postgres";

REVOKE ALL ON FUNCTION "sc_app"."organisation_handle_is_reserved"(text) FROM PUBLIC;
