CREATE OR REPLACE FUNCTION sc_app.can_manage_organisation (
  organisation_id uuid,
  user_id         uuid DEFAULT auth.uid()
)
  RETURNS boolean
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
  select exists (
    select 1
    from sc_app.organisation_members member
    where member.organisation_id = $1
      and member.user_id = $2
      and member.role in ('owner', 'admin')
  );
$function$;

GRANT EXECUTE ON FUNCTION "sc_app"."can_manage_organisation"(uuid, uuid) TO "authenticated", "postgres", "service_role";

REVOKE ALL ON FUNCTION "sc_app"."can_manage_organisation"(uuid, uuid) FROM PUBLIC;
