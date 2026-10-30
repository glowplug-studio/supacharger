CREATE OR REPLACE FUNCTION sc_app.touch_updated_at()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SET search_path TO ''
  AS $function$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$function$;

GRANT EXECUTE ON FUNCTION "sc_app"."touch_updated_at"() TO "postgres";
