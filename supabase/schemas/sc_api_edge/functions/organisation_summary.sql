CREATE OR REPLACE FUNCTION sc_api_edge.organisation_summary (
  organisation_id uuid,
  user_id         uuid,
  session_id      uuid
)
  RETURNS jsonb
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
  select jsonb_build_object(
    'id', organisation.id,
    'name', organisation.name,
    'handle', organisation.handle,
    'bio', organisation.bio,
    'colour_hex', organisation.colour_hex,
    'avatar_path', organisation.avatar_path,
    'header_image_path', organisation.header_image_path,
    'access_policy', organisation.access_policy,
    'role', member.role,
    'is_active', context.active_organisation_id is not null,
    'member_count', (
      select count(*) from sc_app.organisation_members count_member
      where count_member.organisation_id = organisation.id
    ),
    'created_at', organisation.created_at,
    'updated_at', organisation.updated_at
  )
  from sc_app.organisations organisation
  join sc_app.organisation_members member
    on member.organisation_id = organisation.id
   and member.user_id = $2
  left join sc_app.user_session_contexts context
    on context.session_id = $3
   and context.user_id = $2
   and context.active_organisation_id = organisation.id
  where organisation.id = $1;
$function$;

GRANT EXECUTE ON FUNCTION "sc_api_edge"."organisation_summary"(uuid, uuid, uuid) TO "postgres", "service_role";

REVOKE ALL ON FUNCTION "sc_api_edge"."organisation_summary"(uuid, uuid, uuid) FROM PUBLIC;
