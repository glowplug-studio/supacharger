CREATE OR REPLACE FUNCTION sc_app.cancel_social_profile_import_on_edit()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
begin
  insert into sc_app.social_profile_imports(social_profile_import_id, completed_at)
  values (new.id, now())
  on conflict (social_profile_import_id) do update set completed_at = now();
  return new;
end;
$function$;

GRANT EXECUTE ON FUNCTION "sc_app"."cancel_social_profile_import_on_edit"() TO "postgres";

REVOKE ALL ON FUNCTION "sc_app"."cancel_social_profile_import_on_edit"() FROM PUBLIC;
