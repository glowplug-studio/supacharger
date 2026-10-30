CREATE OR REPLACE FUNCTION sc_api.is_profile_complete_by_current_user (
  input_username_required boolean DEFAULT false
)
  RETURNS boolean
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
  select coalesce((
    select nullif(btrim(p.first_name), '') is not null
      and nullif(btrim(p.last_name), '') is not null
      and (
        not input_username_required
        or nullif(btrim(p.username), '') is not null
      )
    from sc_app.profiles p
    where p.id = (select auth.uid())
      and coalesce(((select auth.jwt()) ->> 'is_anonymous')::boolean, false) = false
  ), false);
$function$;

GRANT EXECUTE ON FUNCTION "sc_api"."is_profile_complete_by_current_user"(boolean) TO "authenticated", "postgres";

REVOKE ALL ON FUNCTION "sc_api"."is_profile_complete_by_current_user"(boolean) FROM PUBLIC;
