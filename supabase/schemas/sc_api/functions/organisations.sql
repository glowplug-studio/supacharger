CREATE OR REPLACE FUNCTION sc_api.organisations (
  input_payload jsonb
)
  RETURNS jsonb
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
declare
  action text := coalesce(input_payload ->> 'action', 'list');
  current_user_id uuid := auth.uid();
  current_session_id uuid := nullif((select auth.jwt()) ->> 'session_id', '')::uuid;
  resolved_organisation_id uuid := nullif(coalesce(input_payload ->> 'organisationId', ''), '')::uuid;
  organisation_handle text := sc_app.normalise_organisation_handle(input_payload ->> 'handle');
  organisation_name text := btrim(coalesce(input_payload ->> 'name', input_payload ->> 'title', ''));
  requested_role_text text := lower(btrim(coalesce(input_payload ->> 'role', 'member')));
  requested_role sc_app.organisation_role;
  actor_role sc_app.organisation_role;
  target_role sc_app.organisation_role;
  target_user_id uuid := nullif(coalesce(input_payload ->> 'userId', ''), '')::uuid;
  invitation_id uuid := nullif(coalesce(input_payload ->> 'invitationId', ''), '')::uuid;
  access_request_id uuid := nullif(coalesce(input_payload ->> 'requestId', ''), '')::uuid;
  normalised_email text := lower(btrim(coalesce(input_payload ->> 'email', '')));
  invitation_token text;
  invitation_token_hash text;
  current_user_email text;
  context_result jsonb;
  invitation_record sc_app.organisation_invitations%rowtype;
begin
  if current_user_id is null
    or current_session_id is null
    or coalesce(((select auth.jwt()) ->> 'is_anonymous')::boolean, false) then
    raise exception 'Authentication with a session is required' using errcode = '42501';
  end if;

  if action = 'list' then
    return jsonb_build_object(
      'organisations', coalesce((
        select jsonb_agg(sc_api_edge.organisation_summary(organisation.id, current_user_id, current_session_id)
          order by lower(organisation.name))
        from sc_app.organisations organisation
        join sc_app.organisation_members member
          on member.organisation_id = organisation.id and member.user_id = current_user_id
      ), '[]'::jsonb),
      'activeOrganisationId', (
        select context.active_organisation_id
        from sc_app.user_session_contexts context
        where context.session_id = current_session_id and context.user_id = current_user_id
      )
    );
  end if;

  if action = 'handle.available' then
    return jsonb_build_object(
      'handle', organisation_handle,
      'available', organisation_handle ~ '^[a-z0-9][a-z0-9-]{1,62}[a-z0-9]$'
        and not sc_app.organisation_handle_is_reserved(organisation_handle)
        and not exists (
          select 1 from sc_app.organisations organisation
          where organisation.handle = organisation_handle
        )
    );
  end if;

  if action = 'create' then
    if sc_app.organisation_handle_is_reserved(organisation_handle) then
      raise exception 'Organisation handle is reserved' using errcode = '23514';
    end if;
    if input_payload ? 'colourHex'
      and coalesce(input_payload ->> 'colourHex', '') !~ '^#[0-9A-Fa-f]{6}$' then
      raise exception 'Organisation colour must be a six-digit hex value' using errcode = '22023';
    end if;
    context_result := sc_api_edge.create_organisation_context(
      current_user_id, current_session_id, organisation_name, organisation_handle
    );
    resolved_organisation_id := (context_result ->> 'id')::uuid;
    update sc_app.organisations organisation
    set colour_hex = coalesce(input_payload ->> 'colourHex', organisation.colour_hex)
    where organisation.id = resolved_organisation_id;
    perform sc_api_edge.bind_organisation_billing_account(resolved_organisation_id);
    return sc_api_edge.organisation_summary(resolved_organisation_id, current_user_id, current_session_id)
      || jsonb_build_object('requiresSessionRefresh', true);
  end if;

  if action = 'invites.accept' then
    invitation_token := btrim(coalesce(input_payload ->> 'token', ''));
    if invitation_token = '' then
      raise exception 'Invitation token is required' using errcode = '22023';
    end if;
    invitation_token_hash := encode(extensions.digest(invitation_token, 'sha256'), 'hex');
    select lower(btrim(user_record.email)) into current_user_email
    from auth.users user_record where user_record.id = current_user_id;
    select invitation.* into invitation_record
    from sc_app.organisation_invitations invitation
    where invitation.token_hash = invitation_token_hash
      and invitation.email = current_user_email
      and invitation.accepted_at is null
      and invitation.revoked_at is null
      and invitation.expires_at > timezone('utc', now())
    for update;
    if not found then
      raise exception 'Invitation not found, expired, revoked, or already used' using errcode = 'P0002';
    end if;
    insert into sc_app.organisation_members (organisation_id, user_id, role)
    values (invitation_record.organisation_id, current_user_id, invitation_record.role)
    on conflict (organisation_id, user_id) do nothing;
    update sc_app.organisation_invitations invitation
    set accepted_by = current_user_id, accepted_at = timezone('utc', now())
    where invitation.id = invitation_record.id;
    perform sc_api_edge.bind_organisation_billing_account(invitation_record.organisation_id);
    context_result := sc_api_edge.select_organisation_context(
      current_user_id,
      current_session_id,
      (select organisation.handle from sc_app.organisations organisation
        where organisation.id = invitation_record.organisation_id)
    );
    return sc_api_edge.organisation_summary(
      invitation_record.organisation_id, current_user_id, current_session_id
    ) || jsonb_build_object('requiresSessionRefresh', true);
  end if;

  if action = 'access.request' then
    select organisation.id into resolved_organisation_id
    from sc_app.organisations organisation
    where organisation.handle = organisation_handle
      and organisation.access_policy = 'request';
    if resolved_organisation_id is null then
      raise exception 'Organisation is not accepting access requests' using errcode = 'P0002';
    end if;
    if sc_app.is_organisation_member(resolved_organisation_id, current_user_id) then
      raise exception 'You are already an organisation member' using errcode = '23514';
    end if;
    insert into sc_app.organisation_access_requests (organisation_id, requested_by)
    values (resolved_organisation_id, current_user_id)
    on conflict (organisation_id, requested_by) where status = 'pending'
    do update set updated_at = timezone('utc', now())
    returning id into access_request_id;
    return jsonb_build_object(
      'requestId', access_request_id,
      'status', 'pending',
      'organisation', (select jsonb_build_object('name', organisation.name, 'handle', organisation.handle)
        from sc_app.organisations organisation where organisation.id = resolved_organisation_id)
    );
  end if;

  if resolved_organisation_id is null then
    select organisation.id into resolved_organisation_id
    from sc_app.organisations organisation
    where organisation.handle = organisation_handle;
  end if;
  if resolved_organisation_id is null then
    raise exception 'Organisation not found' using errcode = 'P0002';
  end if;

  select member.role into actor_role
  from sc_app.organisation_members member
  where member.organisation_id = resolved_organisation_id and member.user_id = current_user_id;

  if action = 'switch' then
    if actor_role is null then
      raise exception 'Organisation membership not found' using errcode = '42501';
    end if;
    perform sc_api_edge.select_organisation_context(current_user_id, current_session_id,
      (select organisation.handle from sc_app.organisations organisation where organisation.id = resolved_organisation_id));
    return sc_api_edge.organisation_summary(resolved_organisation_id, current_user_id, current_session_id)
      || jsonb_build_object('requiresSessionRefresh', true);
  end if;

  if actor_role is null then
    raise exception 'Organisation membership not found' using errcode = '42501';
  end if;

  if action in ('read', 'members.list', 'invites.list', 'access.list') then
    return sc_api_edge.organisation_details(resolved_organisation_id, current_user_id, current_session_id);
  end if;

  if actor_role not in ('owner', 'admin') then
    raise exception 'Organisation manager access required' using errcode = '42501';
  end if;

  if action = 'update' then
    if input_payload ? 'name' or input_payload ? 'title' then
      if organisation_name = '' or char_length(organisation_name) > 100 then
        raise exception 'Organisation name must be 1-100 characters' using errcode = '22023';
      end if;
    end if;
    if input_payload ? 'handle' and organisation_handle !~ '^[a-z0-9][a-z0-9-]{1,62}[a-z0-9]$' then
      raise exception 'Organisation handle must use 3-64 lowercase letters, numbers, and hyphens'
        using errcode = '22023';
    end if;
    if input_payload ? 'handle' and sc_app.organisation_handle_is_reserved(organisation_handle) then
      raise exception 'Organisation handle is reserved' using errcode = '23514';
    end if;
    if input_payload ? 'colourHex' and coalesce(input_payload ->> 'colourHex', '') !~ '^#[0-9A-Fa-f]{6}$' then
      raise exception 'Organisation colour must be a six-digit hex value' using errcode = '22023';
    end if;
    if input_payload ? 'bio' and char_length(coalesce(input_payload ->> 'bio', '')) > 300 then
      raise exception 'Organisation bio must be at most 300 characters' using errcode = '22023';
    end if;
    if input_payload ? 'accessPolicy' and coalesce(input_payload ->> 'accessPolicy', '') not in ('closed', 'request') then
      raise exception 'Unsupported organisation access policy' using errcode = '22023';
    end if;
    if input_payload ? 'avatarPath'
      and nullif(btrim(coalesce(input_payload ->> 'avatarPath', '')), '') is not null
      and input_payload ->> 'avatarPath' not like (resolved_organisation_id::text || '/logos/%') then
      raise exception 'Organisation logo path is invalid' using errcode = '22023';
    end if;
    if input_payload ? 'headerImagePath'
      and nullif(btrim(coalesce(input_payload ->> 'headerImagePath', '')), '') is not null
      and input_payload ->> 'headerImagePath' not like (resolved_organisation_id::text || '/headers/%') then
      raise exception 'Organisation header path is invalid' using errcode = '22023';
    end if;
    update sc_app.organisations organisation set
      name = case when input_payload ? 'name' or input_payload ? 'title' then organisation_name else organisation.name end,
      handle = case when input_payload ? 'handle' then organisation_handle else organisation.handle end,
      bio = case when input_payload ? 'bio' then nullif(btrim(input_payload ->> 'bio'), '') else organisation.bio end,
      colour_hex = case when input_payload ? 'colourHex' then input_payload ->> 'colourHex' else organisation.colour_hex end,
      avatar_path = case when input_payload ? 'avatarPath' then nullif(btrim(input_payload ->> 'avatarPath'), '') else organisation.avatar_path end,
      header_image_path = case when input_payload ? 'headerImagePath' then nullif(btrim(input_payload ->> 'headerImagePath'), '') else organisation.header_image_path end,
      access_policy = case when input_payload ? 'accessPolicy' then (input_payload ->> 'accessPolicy')::sc_app.organisation_access_policy else organisation.access_policy end
    where organisation.id = resolved_organisation_id;
    update sc_app.user_session_contexts context
    set context_version = context.context_version + 1
    where context.active_organisation_id = resolved_organisation_id;
    perform sc_api_edge.bind_organisation_billing_account(resolved_organisation_id);
    return sc_api_edge.organisation_details(resolved_organisation_id, current_user_id, current_session_id)
      || jsonb_build_object('requiresSessionRefresh', true);
  end if;

  if requested_role_text not in ('owner', 'admin', 'member') then
    raise exception 'Unsupported organisation role' using errcode = '22023';
  end if;
  requested_role := requested_role_text::sc_app.organisation_role;

  if action = 'members.add' then
    if target_user_id is null then raise exception 'userId is required' using errcode = '22023'; end if;
    if requested_role = 'owner' or (requested_role = 'admin' and actor_role <> 'owner') then
      raise exception 'Only owners can add organisation administrators' using errcode = '42501';
    end if;
    if not exists (select 1 from sc_app.profiles profile where profile.id = target_user_id) then
      raise exception 'User not found' using errcode = 'P0002';
    end if;
    insert into sc_app.organisation_members (organisation_id, user_id, role)
    values (resolved_organisation_id, target_user_id, requested_role)
    on conflict (organisation_id, user_id) do nothing;
    perform sc_api_edge.bind_organisation_billing_account(resolved_organisation_id);
    return sc_api_edge.organisation_details(resolved_organisation_id, current_user_id, current_session_id);
  end if;

  if action = 'members.updateRole' then
    if target_user_id is null then raise exception 'userId is required' using errcode = '22023'; end if;
    select member.role into target_role from sc_app.organisation_members member
    where member.organisation_id = resolved_organisation_id and member.user_id = target_user_id;
    if target_role is null then raise exception 'Member not found' using errcode = 'P0002'; end if;
    if actor_role <> 'owner' and (target_role <> 'member' or requested_role <> 'member') then
      raise exception 'Only owners can change administrator or owner roles' using errcode = '42501';
    end if;
    if target_role = 'owner' and requested_role <> 'owner' and (
      select count(*) from sc_app.organisation_members member
      where member.organisation_id = resolved_organisation_id and member.role = 'owner'
    ) <= 1 then
      raise exception 'Cannot demote the last owner' using errcode = '23514';
    end if;
    update sc_app.organisation_members member set role = requested_role
    where member.organisation_id = resolved_organisation_id and member.user_id = target_user_id;
    update sc_app.user_session_contexts context set context_version = context.context_version + 1
    where context.user_id = target_user_id and context.active_organisation_id = resolved_organisation_id;
    perform sc_api_edge.bind_organisation_billing_account(resolved_organisation_id);
    return sc_api_edge.organisation_details(resolved_organisation_id, current_user_id, current_session_id);
  end if;

  if action = 'members.remove' then
    if target_user_id is null then raise exception 'userId is required' using errcode = '22023'; end if;
    select member.role into target_role from sc_app.organisation_members member
    where member.organisation_id = resolved_organisation_id and member.user_id = target_user_id;
    if target_role is null then raise exception 'Member not found' using errcode = 'P0002'; end if;
    if target_role = 'owner' and actor_role <> 'owner' then
      raise exception 'Only owners can remove owners' using errcode = '42501';
    end if;
    if target_role = 'owner' and (
      select count(*) from sc_app.organisation_members member
      where member.organisation_id = resolved_organisation_id and member.role = 'owner'
    ) <= 1 then
      raise exception 'Cannot remove the last owner' using errcode = '23514';
    end if;
    delete from sc_app.organisation_members member
    where member.organisation_id = resolved_organisation_id and member.user_id = target_user_id;
    delete from sc_app.user_session_contexts context
    where context.user_id = target_user_id and context.active_organisation_id = resolved_organisation_id;
    perform sc_api_edge.bind_organisation_billing_account(resolved_organisation_id);
    return sc_api_edge.organisation_details(resolved_organisation_id, current_user_id, current_session_id);
  end if;

  if action = 'invites.create' then
    if normalised_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then
      raise exception 'A valid email is required' using errcode = '22023';
    end if;
    if requested_role = 'owner' or (requested_role = 'admin' and actor_role <> 'owner') then
      raise exception 'Only owners can invite organisation administrators' using errcode = '42501';
    end if;
    update sc_app.organisation_invitations invitation set revoked_at = timezone('utc', now())
    where invitation.organisation_id = resolved_organisation_id
      and invitation.email = normalised_email
      and invitation.accepted_at is null and invitation.revoked_at is null;
    invitation_token := encode(extensions.gen_random_bytes(32), 'hex');
    invitation_token_hash := encode(extensions.digest(invitation_token, 'sha256'), 'hex');
    insert into sc_app.organisation_invitations (
      organisation_id, email, role, token_hash, invited_by
    ) values (
      resolved_organisation_id, normalised_email, requested_role, invitation_token_hash, current_user_id
    ) returning id into invitation_id;
    return sc_api_edge.organisation_details(resolved_organisation_id, current_user_id, current_session_id)
      || jsonb_build_object('invitationId', invitation_id, 'inviteToken', invitation_token);
  end if;

  if action = 'invites.revoke' then
    if invitation_id is null then raise exception 'invitationId is required' using errcode = '22023'; end if;
    update sc_app.organisation_invitations invitation set revoked_at = timezone('utc', now())
    where invitation.id = invitation_id and invitation.organisation_id = resolved_organisation_id
      and invitation.accepted_at is null and invitation.revoked_at is null;
    if not found then raise exception 'Pending invitation not found' using errcode = 'P0002'; end if;
    return sc_api_edge.organisation_details(resolved_organisation_id, current_user_id, current_session_id);
  end if;

  if action in ('access.approve', 'access.reject') then
    if access_request_id is null then raise exception 'requestId is required' using errcode = '22023'; end if;
    select request.requested_by into target_user_id
    from sc_app.organisation_access_requests request
    where request.id = access_request_id and request.organisation_id = resolved_organisation_id
      and request.status = 'pending' for update;
    if target_user_id is null then raise exception 'Pending access request not found' using errcode = 'P0002'; end if;
    if action = 'access.approve' then
      insert into sc_app.organisation_members (organisation_id, user_id, role)
      values (resolved_organisation_id, target_user_id, 'member')
      on conflict (organisation_id, user_id) do nothing;
    end if;
    update sc_app.organisation_access_requests request
    set status = case when action = 'access.approve' then 'approved' else 'rejected' end::sc_app.organisation_access_request_status,
        reviewed_by = current_user_id,
        reviewed_at = timezone('utc', now())
    where request.id = access_request_id;
    perform sc_api_edge.bind_organisation_billing_account(resolved_organisation_id);
    return sc_api_edge.organisation_details(resolved_organisation_id, current_user_id, current_session_id);
  end if;

  raise exception 'Unsupported organisation action' using errcode = '22023';
end;
$function$;

GRANT EXECUTE ON FUNCTION "sc_api"."organisations"(jsonb) TO "authenticated", "postgres";

COMMENT ON FUNCTION "sc_api"."organisations"(jsonb) IS 'Authenticated organisation management boundary. Identity and session come only from the verified JWT. Invitation tokens are stored as hashes and returned only when created.';

REVOKE ALL ON FUNCTION "sc_api"."organisations"(jsonb) FROM PUBLIC;
