CREATE OR REPLACE FUNCTION sc_app.record_profile_username_edit()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
begin
  insert into sc_app.profile_username_initialisations(profile_username_initialisation_id)
  values (new.id) on conflict do nothing;
  return new;
end;
$function$;

GRANT EXECUTE ON FUNCTION "sc_app"."record_profile_username_edit"() TO "postgres";

REVOKE ALL ON FUNCTION "sc_app"."record_profile_username_edit"() FROM PUBLIC;
