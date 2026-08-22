begin;

create or replace function api.organisations(input_payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  action text := input_payload ->> 'action';
  current_user_id uuid := auth.uid();
  current_session_id uuid := nullif((select auth.jwt()) ->> 'session_id', '')::uuid;
begin
  if current_user_id is null
    or current_session_id is null
    or coalesce(((select auth.jwt()) ->> 'is_anonymous')::boolean, false) then
    raise exception 'Authentication with a session is required' using errcode = '42501';
  end if;

  if action = 'create' then
    return api_edge.create_organisation_context(
      current_user_id,
      current_session_id,
      input_payload ->> 'title',
      input_payload ->> 'handle'
    );
  end if;

  if action = 'switch' then
    return api_edge.select_organisation_context(
      current_user_id,
      current_session_id,
      input_payload ->> 'handle'
    );
  end if;

  raise exception 'Unsupported organisation action' using errcode = '22023';
end;
$$;

revoke all on function api.organisations(jsonb) from public, anon;
grant execute on function api.organisations(jsonb) to authenticated;

comment on function api.organisations(jsonb) is
  'Authenticated organisation context dispatcher. Derives user and session identity from the verified JWT.';

commit;
