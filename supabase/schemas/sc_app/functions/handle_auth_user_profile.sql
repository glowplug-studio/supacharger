CREATE OR REPLACE FUNCTION sc_app.handle_auth_user_profile()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
begin
  insert into sc_app.profiles (
    id, first_name, last_name, username, email, avatar_path
  ) values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'first_name', ''),
    coalesce(new.raw_user_meta_data ->> 'last_name', ''),
    nullif(new.raw_user_meta_data ->> 'username', ''),
    new.email,
    case
      when new.raw_user_meta_data ->> 'avatar_path' like (new.id::text || '/avatar-%')
      then new.raw_user_meta_data ->> 'avatar_path'
      else null
    end
  )
  on conflict (id) do update set email = excluded.email;
  return new;
end;
$function$;

GRANT EXECUTE ON FUNCTION "sc_app"."handle_auth_user_profile"() TO "postgres";

REVOKE ALL ON FUNCTION "sc_app"."handle_auth_user_profile"() FROM PUBLIC;
