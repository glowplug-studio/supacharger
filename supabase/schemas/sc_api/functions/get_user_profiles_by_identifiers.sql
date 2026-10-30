CREATE OR REPLACE FUNCTION sc_api.get_user_profiles_by_identifiers (
  input_identifiers text[]
)
  RETURNS TABLE (
    user_id           uuid,
    first_name        text,
    last_name         text,
    username          text,
    avatar_path       text,
    header_image_path text
  )
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
  with requested as (
    select distinct lower(btrim(identifier)) as identifier
    from unnest(coalesce(input_identifiers, array[]::text[])) as identifier
    where btrim(identifier) <> ''
  )
  select p.id, p.first_name, p.last_name, p.username, p.avatar_path, p.header_image_path
  from sc_app.profiles p
  join requested r on lower(p.id::text) = r.identifier or lower(p.username) = r.identifier
  where (select auth.uid()) is not null
    and coalesce(((select auth.jwt()) ->> 'is_anonymous')::boolean, false) = false
  order by p.updated_at desc;
$function$;

GRANT EXECUTE ON FUNCTION "sc_api"."get_user_profiles_by_identifiers"(text[]) TO "authenticated", "postgres";

REVOKE ALL ON FUNCTION "sc_api"."get_user_profiles_by_identifiers"(text[]) FROM PUBLIC;
