CREATE OR REPLACE FUNCTION sc_app.normalise_organisation_handle (
  p_value text
)
  RETURNS text
  LANGUAGE sql
  IMMUTABLE
  SET search_path TO ''
  AS $function$
  select lower(regexp_replace(btrim(coalesce(p_value, '')), '[^a-zA-Z0-9-]+', '-', 'g'));
$function$;

GRANT EXECUTE ON FUNCTION "sc_app"."normalise_organisation_handle"(text) TO "postgres";

REVOKE ALL ON FUNCTION "sc_app"."normalise_organisation_handle"(text) FROM PUBLIC;
