CREATE OR REPLACE FUNCTION sc_api.update_account_language_by_current_user (
  input_language_code text
)
  RETURNS void
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
declare v_user_id uuid := (select auth.uid());
begin
  if v_user_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;
  if input_language_code is not null and input_language_code !~ '^[a-z]{2}$' then
    raise exception 'Language code must be a lowercase ISO 639-1 code' using errcode = '22023';
  end if;
  update sc_app.profiles set language_code = input_language_code where id = v_user_id;
end;
$function$;

GRANT EXECUTE ON FUNCTION "sc_api"."update_account_language_by_current_user"(text) TO "authenticated", "postgres";

REVOKE ALL ON FUNCTION "sc_api"."update_account_language_by_current_user"(text) FROM PUBLIC;
