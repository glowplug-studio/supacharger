CREATE OR REPLACE FUNCTION sc_api_edge.organisation_details (
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
  select sc_api_edge.organisation_summary($1, $2, $3) || jsonb_build_object(
    'members', coalesce((
      select jsonb_agg(jsonb_build_object(
        'user_id', member.user_id,
        'role', member.role,
        'joined_at', member.created_at,
        'first_name', profile.first_name,
        'last_name', profile.last_name,
        'username', profile.username,
        'avatar_path', profile.avatar_path
      ) order by
        case member.role when 'owner' then 0 when 'admin' then 1 else 2 end,
        lower(coalesce(profile.first_name, '')),
        lower(coalesce(profile.last_name, '')))
      from sc_app.organisation_members member
      left join sc_app.profiles profile on profile.id = member.user_id
      where member.organisation_id = $1
    ), '[]'::jsonb),
    'invitations', case when sc_app.can_manage_organisation($1, $2) then coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', invitation.id,
        'email', invitation.email,
        'role', invitation.role,
        'invited_by', invitation.invited_by,
        'expires_at', invitation.expires_at,
        'created_at', invitation.created_at
      ) order by invitation.created_at desc)
      from sc_app.organisation_invitations invitation
      where invitation.organisation_id = $1
        and invitation.accepted_at is null
        and invitation.revoked_at is null
    ), '[]'::jsonb) else '[]'::jsonb end,
    'access_requests', case when sc_app.can_manage_organisation($1, $2) then coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', request.id,
        'user_id', request.requested_by,
        'status', request.status,
        'created_at', request.created_at,
        'first_name', profile.first_name,
        'last_name', profile.last_name,
        'username', profile.username,
        'avatar_path', profile.avatar_path
      ) order by request.created_at)
      from sc_app.organisation_access_requests request
      left join sc_app.profiles profile on profile.id = request.requested_by
      where request.organisation_id = $1 and request.status = 'pending'
    ), '[]'::jsonb) else '[]'::jsonb end
  );
$function$;

GRANT EXECUTE ON FUNCTION "sc_api_edge"."organisation_details"(uuid, uuid, uuid) TO "postgres", "service_role";

REVOKE ALL ON FUNCTION "sc_api_edge"."organisation_details"(uuid, uuid, uuid) FROM PUBLIC;
