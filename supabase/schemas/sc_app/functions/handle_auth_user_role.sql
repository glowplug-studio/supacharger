CREATE OR REPLACE FUNCTION sc_app.handle_auth_user_role()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
begin
  insert into sc_app.user_roles (user_id)
  values (new.id)
  on conflict (user_id) do nothing;
  return new;
end;
$function$;

GRANT EXECUTE ON FUNCTION "sc_app"."handle_auth_user_role"() TO "postgres";

REVOKE ALL ON FUNCTION "sc_app"."handle_auth_user_role"() FROM PUBLIC;
