begin;

create type app.organisation_access_policy as enum ('closed', 'request');
create type app.organisation_access_request_status as enum ('pending', 'approved', 'rejected', 'cancelled');

alter table app.organisations
  add column bio text,
  add column colour_hex text not null default '#2563EB',
  add column avatar_path text,
  add column header_image_path text,
  add column access_policy app.organisation_access_policy not null default 'closed',
  add constraint organisations_bio_length check (bio is null or char_length(bio) <= 300),
  add constraint organisations_colour_hex check (colour_hex ~ '^#[0-9A-Fa-f]{6}$'),
  add constraint organisations_avatar_path_folder check (
    avatar_path is null or avatar_path like (id::text || '/logos/%')
  ),
  add constraint organisations_header_image_path_folder check (
    header_image_path is null or header_image_path like (id::text || '/headers/%')
  );

create table app.organisation_invitations (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references app.organisations(id) on delete cascade,
  email text not null,
  role app.organisation_role not null default 'member',
  token_hash text not null,
  invited_by uuid not null references auth.users(id),
  accepted_by uuid references auth.users(id),
  accepted_at timestamptz,
  revoked_at timestamptz,
  expires_at timestamptz not null default timezone('utc', now()) + interval '14 days',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint organisation_invitations_email_normalised check (
    email = lower(btrim(email))
    and email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
  ),
  constraint organisation_invitations_non_owner_role check (role <> 'owner'),
  constraint organisation_invitations_token_hash check (token_hash ~ '^[0-9a-f]{64}$'),
  constraint organisation_invitations_acceptance check (
    (accepted_at is null and accepted_by is null)
    or (accepted_at is not null and accepted_by is not null)
  )
);

create unique index organisation_invitations_pending_email_key
  on app.organisation_invitations (organisation_id, lower(email))
  where accepted_at is null and revoked_at is null;
create unique index organisation_invitations_token_hash_key
  on app.organisation_invitations (token_hash);

create table app.organisation_access_requests (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references app.organisations(id) on delete cascade,
  requested_by uuid not null references auth.users(id) on delete cascade,
  status app.organisation_access_request_status not null default 'pending',
  reviewed_by uuid references auth.users(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint organisation_access_requests_review check (
    (status = 'pending' and reviewed_by is null and reviewed_at is null)
    or (status <> 'pending' and reviewed_by is not null and reviewed_at is not null)
  )
);

create unique index organisation_access_requests_pending_user_key
  on app.organisation_access_requests (organisation_id, requested_by)
  where status = 'pending';
create index organisation_access_requests_requester_idx
  on app.organisation_access_requests (requested_by, created_at desc);

alter table app.organisation_invitations enable row level security;
alter table app.organisation_access_requests enable row level security;
revoke all on app.organisation_invitations, app.organisation_access_requests
  from public, anon, authenticated;
grant all on app.organisation_invitations, app.organisation_access_requests to service_role;

create trigger organisation_invitations_touch_updated_at
before update on app.organisation_invitations
for each row execute function app.touch_updated_at();
create trigger organisation_access_requests_touch_updated_at
before update on app.organisation_access_requests
for each row execute function app.touch_updated_at();

create or replace function app.is_organisation_member(
  organisation_id uuid,
  user_id uuid default auth.uid()
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from app.organisation_members member
    where member.organisation_id = $1
      and member.user_id = $2
  );
$$;

create or replace function app.can_manage_organisation(
  organisation_id uuid,
  user_id uuid default auth.uid()
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from app.organisation_members member
    where member.organisation_id = $1
      and member.user_id = $2
      and member.role in ('owner', 'admin')
  );
$$;

create function app.organisation_handle_is_reserved(value text)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select lower(btrim(coalesce($1, ''))) = any(array[
    'account', 'api', 'auth', 'en', 'fr', 'organisation', 'organisations',
    'pricing', 'settings', 'static', 'subscribe'
  ]::text[]);
$$;

revoke all on function app.is_organisation_member(uuid, uuid) from public, anon, authenticated;
revoke all on function app.can_manage_organisation(uuid, uuid) from public, anon, authenticated;
revoke all on function app.organisation_handle_is_reserved(text) from public, anon, authenticated;
grant execute on function app.is_organisation_member(uuid, uuid) to authenticated, service_role;
grant execute on function app.can_manage_organisation(uuid, uuid) to authenticated, service_role;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'organisation-logos',
  'organisation-logos',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

create policy organisation_logos_select_members
on storage.objects for select to authenticated
using (
  bucket_id = 'organisation-logos'
  and (storage.foldername(name))[2] in ('logos', 'headers')
  and exists (
    select 1 from app.organisations organisation
    where organisation.id::text = (storage.foldername(name))[1]
      and app.is_organisation_member(organisation.id, (select auth.uid()))
  )
);

create policy organisation_logos_insert_managers
on storage.objects for insert to authenticated
with check (
  bucket_id = 'organisation-logos'
  and (storage.foldername(name))[2] in ('logos', 'headers')
  and array_length(storage.foldername(name), 1) = 3
  and app.can_manage_organisation(
    (select organisation.id from app.organisations organisation
      where organisation.id::text = (storage.foldername(name))[1]),
    (select auth.uid())
  )
);

create policy organisation_logos_update_managers
on storage.objects for update to authenticated
using (
  bucket_id = 'organisation-logos'
  and (storage.foldername(name))[2] in ('logos', 'headers')
  and app.can_manage_organisation(
    (select organisation.id from app.organisations organisation
      where organisation.id::text = (storage.foldername(name))[1]),
    (select auth.uid())
  )
)
with check (
  bucket_id = 'organisation-logos'
  and (storage.foldername(name))[2] in ('logos', 'headers')
  and array_length(storage.foldername(name), 1) = 3
  and app.can_manage_organisation(
    (select organisation.id from app.organisations organisation
      where organisation.id::text = (storage.foldername(name))[1]),
    (select auth.uid())
  )
);

create policy organisation_logos_delete_managers
on storage.objects for delete to authenticated
using (
  bucket_id = 'organisation-logos'
  and (storage.foldername(name))[2] in ('logos', 'headers')
  and app.can_manage_organisation(
    (select organisation.id from app.organisations organisation
      where organisation.id::text = (storage.foldername(name))[1]),
    (select auth.uid())
  )
);

create function api_edge.organisation_summary(
  organisation_id uuid,
  user_id uuid,
  session_id uuid
)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
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
      select count(*) from app.organisation_members count_member
      where count_member.organisation_id = organisation.id
    ),
    'created_at', organisation.created_at,
    'updated_at', organisation.updated_at
  )
  from app.organisations organisation
  join app.organisation_members member
    on member.organisation_id = organisation.id
   and member.user_id = $2
  left join app.user_session_contexts context
    on context.session_id = $3
   and context.user_id = $2
   and context.active_organisation_id = organisation.id
  where organisation.id = $1;
$$;

create function api_edge.organisation_details(
  organisation_id uuid,
  user_id uuid,
  session_id uuid
)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select api_edge.organisation_summary($1, $2, $3) || jsonb_build_object(
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
      from app.organisation_members member
      left join app.profiles profile on profile.id = member.user_id
      where member.organisation_id = $1
    ), '[]'::jsonb),
    'invitations', case when app.can_manage_organisation($1, $2) then coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', invitation.id,
        'email', invitation.email,
        'role', invitation.role,
        'invited_by', invitation.invited_by,
        'expires_at', invitation.expires_at,
        'created_at', invitation.created_at
      ) order by invitation.created_at desc)
      from app.organisation_invitations invitation
      where invitation.organisation_id = $1
        and invitation.accepted_at is null
        and invitation.revoked_at is null
    ), '[]'::jsonb) else '[]'::jsonb end,
    'access_requests', case when app.can_manage_organisation($1, $2) then coalesce((
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
      from app.organisation_access_requests request
      left join app.profiles profile on profile.id = request.requested_by
      where request.organisation_id = $1 and request.status = 'pending'
    ), '[]'::jsonb) else '[]'::jsonb end
  );
$$;

create function api_edge.bind_organisation_billing_account(organisation_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  resolved_billing_account_id uuid;
begin
  insert into app.billing_accounts (subject_type, subject_id, display_name)
  select 'organisation', organisation.id, organisation.name
  from app.organisations organisation
  where organisation.id = $1
  on conflict (subject_type, subject_id) do update
    set display_name = excluded.display_name,
        updated_at = timezone('utc', now())
  returning id into resolved_billing_account_id;

  insert into app.billing_account_members (billing_account_id, user_id, role)
  select resolved_billing_account_id, member.user_id,
    case member.role when 'owner' then 'owner' when 'admin' then 'billing_admin' else 'member' end
  from app.organisation_members member
  where member.organisation_id = $1
  on conflict (billing_account_id, user_id) do update set role = excluded.role;

  delete from app.billing_account_members billing_member
  where billing_member.billing_account_id = resolved_billing_account_id
    and not exists (
      select 1 from app.organisation_members member
      where member.organisation_id = $1 and member.user_id = billing_member.user_id
    );

  return resolved_billing_account_id;
end;
$$;

revoke all on function api_edge.organisation_summary(uuid, uuid, uuid) from public, anon, authenticated;
revoke all on function api_edge.organisation_details(uuid, uuid, uuid) from public, anon, authenticated;
revoke all on function api_edge.bind_organisation_billing_account(uuid) from public, anon, authenticated;
grant execute on function api_edge.organisation_summary(uuid, uuid, uuid) to service_role;
grant execute on function api_edge.organisation_details(uuid, uuid, uuid) to service_role;
grant execute on function api_edge.bind_organisation_billing_account(uuid) to service_role;

create or replace function api.organisations(input_payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  action text := coalesce(input_payload ->> 'action', 'list');
  current_user_id uuid := auth.uid();
  current_session_id uuid := nullif((select auth.jwt()) ->> 'session_id', '')::uuid;
  resolved_organisation_id uuid := nullif(coalesce(input_payload ->> 'organisationId', ''), '')::uuid;
  organisation_handle text := app.normalise_organisation_handle(input_payload ->> 'handle');
  organisation_name text := btrim(coalesce(input_payload ->> 'name', input_payload ->> 'title', ''));
  requested_role_text text := lower(btrim(coalesce(input_payload ->> 'role', 'member')));
  requested_role app.organisation_role;
  actor_role app.organisation_role;
  target_role app.organisation_role;
  target_user_id uuid := nullif(coalesce(input_payload ->> 'userId', ''), '')::uuid;
  invitation_id uuid := nullif(coalesce(input_payload ->> 'invitationId', ''), '')::uuid;
  access_request_id uuid := nullif(coalesce(input_payload ->> 'requestId', ''), '')::uuid;
  normalised_email text := lower(btrim(coalesce(input_payload ->> 'email', '')));
  invitation_token text;
  invitation_token_hash text;
  current_user_email text;
  context_result jsonb;
  invitation_record app.organisation_invitations%rowtype;
begin
  if current_user_id is null
    or current_session_id is null
    or coalesce(((select auth.jwt()) ->> 'is_anonymous')::boolean, false) then
    raise exception 'Authentication with a session is required' using errcode = '42501';
  end if;

  if action = 'list' then
    return jsonb_build_object(
      'organisations', coalesce((
        select jsonb_agg(api_edge.organisation_summary(organisation.id, current_user_id, current_session_id)
          order by lower(organisation.name))
        from app.organisations organisation
        join app.organisation_members member
          on member.organisation_id = organisation.id and member.user_id = current_user_id
      ), '[]'::jsonb),
      'activeOrganisationId', (
        select context.active_organisation_id
        from app.user_session_contexts context
        where context.session_id = current_session_id and context.user_id = current_user_id
      )
    );
  end if;

  if action = 'handle.available' then
    return jsonb_build_object(
      'handle', organisation_handle,
      'available', organisation_handle ~ '^[a-z0-9][a-z0-9-]{1,62}[a-z0-9]$'
        and not app.organisation_handle_is_reserved(organisation_handle)
        and not exists (
          select 1 from app.organisations organisation
          where organisation.handle = organisation_handle
        )
    );
  end if;

  if action = 'create' then
    if app.organisation_handle_is_reserved(organisation_handle) then
      raise exception 'Organisation handle is reserved' using errcode = '23514';
    end if;
    if input_payload ? 'colourHex'
      and coalesce(input_payload ->> 'colourHex', '') !~ '^#[0-9A-Fa-f]{6}$' then
      raise exception 'Organisation colour must be a six-digit hex value' using errcode = '22023';
    end if;
    context_result := api_edge.create_organisation_context(
      current_user_id, current_session_id, organisation_name, organisation_handle
    );
    resolved_organisation_id := (context_result ->> 'id')::uuid;
    update app.organisations organisation
    set colour_hex = coalesce(input_payload ->> 'colourHex', organisation.colour_hex)
    where organisation.id = resolved_organisation_id;
    perform api_edge.bind_organisation_billing_account(resolved_organisation_id);
    return api_edge.organisation_summary(resolved_organisation_id, current_user_id, current_session_id)
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
    from app.organisation_invitations invitation
    where invitation.token_hash = invitation_token_hash
      and invitation.email = current_user_email
      and invitation.accepted_at is null
      and invitation.revoked_at is null
      and invitation.expires_at > timezone('utc', now())
    for update;
    if not found then
      raise exception 'Invitation not found, expired, revoked, or already used' using errcode = 'P0002';
    end if;
    insert into app.organisation_members (organisation_id, user_id, role)
    values (invitation_record.organisation_id, current_user_id, invitation_record.role)
    on conflict (organisation_id, user_id) do nothing;
    update app.organisation_invitations invitation
    set accepted_by = current_user_id, accepted_at = timezone('utc', now())
    where invitation.id = invitation_record.id;
    perform api_edge.bind_organisation_billing_account(invitation_record.organisation_id);
    context_result := api_edge.select_organisation_context(
      current_user_id,
      current_session_id,
      (select organisation.handle from app.organisations organisation
        where organisation.id = invitation_record.organisation_id)
    );
    return api_edge.organisation_summary(
      invitation_record.organisation_id, current_user_id, current_session_id
    ) || jsonb_build_object('requiresSessionRefresh', true);
  end if;

  if action = 'access.request' then
    select organisation.id into resolved_organisation_id
    from app.organisations organisation
    where organisation.handle = organisation_handle
      and organisation.access_policy = 'request';
    if resolved_organisation_id is null then
      raise exception 'Organisation is not accepting access requests' using errcode = 'P0002';
    end if;
    if app.is_organisation_member(resolved_organisation_id, current_user_id) then
      raise exception 'You are already an organisation member' using errcode = '23514';
    end if;
    insert into app.organisation_access_requests (organisation_id, requested_by)
    values (resolved_organisation_id, current_user_id)
    on conflict (organisation_id, requested_by) where status = 'pending'
    do update set updated_at = timezone('utc', now())
    returning id into access_request_id;
    return jsonb_build_object(
      'requestId', access_request_id,
      'status', 'pending',
      'organisation', (select jsonb_build_object('name', organisation.name, 'handle', organisation.handle)
        from app.organisations organisation where organisation.id = resolved_organisation_id)
    );
  end if;

  if resolved_organisation_id is null then
    select organisation.id into resolved_organisation_id
    from app.organisations organisation
    where organisation.handle = organisation_handle;
  end if;
  if resolved_organisation_id is null then
    raise exception 'Organisation not found' using errcode = 'P0002';
  end if;

  select member.role into actor_role
  from app.organisation_members member
  where member.organisation_id = resolved_organisation_id and member.user_id = current_user_id;

  if action = 'switch' then
    if actor_role is null then
      raise exception 'Organisation membership not found' using errcode = '42501';
    end if;
    perform api_edge.select_organisation_context(current_user_id, current_session_id,
      (select organisation.handle from app.organisations organisation where organisation.id = resolved_organisation_id));
    return api_edge.organisation_summary(resolved_organisation_id, current_user_id, current_session_id)
      || jsonb_build_object('requiresSessionRefresh', true);
  end if;

  if actor_role is null then
    raise exception 'Organisation membership not found' using errcode = '42501';
  end if;

  if action in ('read', 'members.list', 'invites.list', 'access.list') then
    return api_edge.organisation_details(resolved_organisation_id, current_user_id, current_session_id);
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
    if input_payload ? 'handle' and app.organisation_handle_is_reserved(organisation_handle) then
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
    update app.organisations organisation set
      name = case when input_payload ? 'name' or input_payload ? 'title' then organisation_name else organisation.name end,
      handle = case when input_payload ? 'handle' then organisation_handle else organisation.handle end,
      bio = case when input_payload ? 'bio' then nullif(btrim(input_payload ->> 'bio'), '') else organisation.bio end,
      colour_hex = case when input_payload ? 'colourHex' then input_payload ->> 'colourHex' else organisation.colour_hex end,
      avatar_path = case when input_payload ? 'avatarPath' then nullif(btrim(input_payload ->> 'avatarPath'), '') else organisation.avatar_path end,
      header_image_path = case when input_payload ? 'headerImagePath' then nullif(btrim(input_payload ->> 'headerImagePath'), '') else organisation.header_image_path end,
      access_policy = case when input_payload ? 'accessPolicy' then (input_payload ->> 'accessPolicy')::app.organisation_access_policy else organisation.access_policy end
    where organisation.id = resolved_organisation_id;
    update app.user_session_contexts context
    set context_version = context.context_version + 1
    where context.active_organisation_id = resolved_organisation_id;
    perform api_edge.bind_organisation_billing_account(resolved_organisation_id);
    return api_edge.organisation_details(resolved_organisation_id, current_user_id, current_session_id)
      || jsonb_build_object('requiresSessionRefresh', true);
  end if;

  if requested_role_text not in ('owner', 'admin', 'member') then
    raise exception 'Unsupported organisation role' using errcode = '22023';
  end if;
  requested_role := requested_role_text::app.organisation_role;

  if action = 'members.add' then
    if target_user_id is null then raise exception 'userId is required' using errcode = '22023'; end if;
    if requested_role = 'owner' or (requested_role = 'admin' and actor_role <> 'owner') then
      raise exception 'Only owners can add organisation administrators' using errcode = '42501';
    end if;
    if not exists (select 1 from app.profiles profile where profile.id = target_user_id) then
      raise exception 'User not found' using errcode = 'P0002';
    end if;
    insert into app.organisation_members (organisation_id, user_id, role)
    values (resolved_organisation_id, target_user_id, requested_role)
    on conflict (organisation_id, user_id) do nothing;
    perform api_edge.bind_organisation_billing_account(resolved_organisation_id);
    return api_edge.organisation_details(resolved_organisation_id, current_user_id, current_session_id);
  end if;

  if action = 'members.updateRole' then
    if target_user_id is null then raise exception 'userId is required' using errcode = '22023'; end if;
    select member.role into target_role from app.organisation_members member
    where member.organisation_id = resolved_organisation_id and member.user_id = target_user_id;
    if target_role is null then raise exception 'Member not found' using errcode = 'P0002'; end if;
    if actor_role <> 'owner' and (target_role <> 'member' or requested_role <> 'member') then
      raise exception 'Only owners can change administrator or owner roles' using errcode = '42501';
    end if;
    if target_role = 'owner' and requested_role <> 'owner' and (
      select count(*) from app.organisation_members member
      where member.organisation_id = resolved_organisation_id and member.role = 'owner'
    ) <= 1 then
      raise exception 'Cannot demote the last owner' using errcode = '23514';
    end if;
    update app.organisation_members member set role = requested_role
    where member.organisation_id = resolved_organisation_id and member.user_id = target_user_id;
    update app.user_session_contexts context set context_version = context.context_version + 1
    where context.user_id = target_user_id and context.active_organisation_id = resolved_organisation_id;
    perform api_edge.bind_organisation_billing_account(resolved_organisation_id);
    return api_edge.organisation_details(resolved_organisation_id, current_user_id, current_session_id);
  end if;

  if action = 'members.remove' then
    if target_user_id is null then raise exception 'userId is required' using errcode = '22023'; end if;
    select member.role into target_role from app.organisation_members member
    where member.organisation_id = resolved_organisation_id and member.user_id = target_user_id;
    if target_role is null then raise exception 'Member not found' using errcode = 'P0002'; end if;
    if target_role = 'owner' and actor_role <> 'owner' then
      raise exception 'Only owners can remove owners' using errcode = '42501';
    end if;
    if target_role = 'owner' and (
      select count(*) from app.organisation_members member
      where member.organisation_id = resolved_organisation_id and member.role = 'owner'
    ) <= 1 then
      raise exception 'Cannot remove the last owner' using errcode = '23514';
    end if;
    delete from app.organisation_members member
    where member.organisation_id = resolved_organisation_id and member.user_id = target_user_id;
    delete from app.user_session_contexts context
    where context.user_id = target_user_id and context.active_organisation_id = resolved_organisation_id;
    perform api_edge.bind_organisation_billing_account(resolved_organisation_id);
    return api_edge.organisation_details(resolved_organisation_id, current_user_id, current_session_id);
  end if;

  if action = 'invites.create' then
    if normalised_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then
      raise exception 'A valid email is required' using errcode = '22023';
    end if;
    if requested_role = 'owner' or (requested_role = 'admin' and actor_role <> 'owner') then
      raise exception 'Only owners can invite organisation administrators' using errcode = '42501';
    end if;
    update app.organisation_invitations invitation set revoked_at = timezone('utc', now())
    where invitation.organisation_id = resolved_organisation_id
      and invitation.email = normalised_email
      and invitation.accepted_at is null and invitation.revoked_at is null;
    invitation_token := encode(extensions.gen_random_bytes(32), 'hex');
    invitation_token_hash := encode(extensions.digest(invitation_token, 'sha256'), 'hex');
    insert into app.organisation_invitations (
      organisation_id, email, role, token_hash, invited_by
    ) values (
      resolved_organisation_id, normalised_email, requested_role, invitation_token_hash, current_user_id
    ) returning id into invitation_id;
    return api_edge.organisation_details(resolved_organisation_id, current_user_id, current_session_id)
      || jsonb_build_object('invitationId', invitation_id, 'inviteToken', invitation_token);
  end if;

  if action = 'invites.revoke' then
    if invitation_id is null then raise exception 'invitationId is required' using errcode = '22023'; end if;
    update app.organisation_invitations invitation set revoked_at = timezone('utc', now())
    where invitation.id = invitation_id and invitation.organisation_id = resolved_organisation_id
      and invitation.accepted_at is null and invitation.revoked_at is null;
    if not found then raise exception 'Pending invitation not found' using errcode = 'P0002'; end if;
    return api_edge.organisation_details(resolved_organisation_id, current_user_id, current_session_id);
  end if;

  if action in ('access.approve', 'access.reject') then
    if access_request_id is null then raise exception 'requestId is required' using errcode = '22023'; end if;
    select request.requested_by into target_user_id
    from app.organisation_access_requests request
    where request.id = access_request_id and request.organisation_id = resolved_organisation_id
      and request.status = 'pending' for update;
    if target_user_id is null then raise exception 'Pending access request not found' using errcode = 'P0002'; end if;
    if action = 'access.approve' then
      insert into app.organisation_members (organisation_id, user_id, role)
      values (resolved_organisation_id, target_user_id, 'member')
      on conflict (organisation_id, user_id) do nothing;
    end if;
    update app.organisation_access_requests request
    set status = case when action = 'access.approve' then 'approved' else 'rejected' end::app.organisation_access_request_status,
        reviewed_by = current_user_id,
        reviewed_at = timezone('utc', now())
    where request.id = access_request_id;
    perform api_edge.bind_organisation_billing_account(resolved_organisation_id);
    return api_edge.organisation_details(resolved_organisation_id, current_user_id, current_session_id);
  end if;

  raise exception 'Unsupported organisation action' using errcode = '22023';
end;
$$;

revoke all on function api.organisations(jsonb) from public, anon;
grant execute on function api.organisations(jsonb) to authenticated;
comment on function api.organisations(jsonb) is
  'Authenticated organisation management boundary. Identity and session come only from the verified JWT. Invitation tokens are stored as hashes and returned only when created.';

notify pgrst, 'reload schema';

commit;
