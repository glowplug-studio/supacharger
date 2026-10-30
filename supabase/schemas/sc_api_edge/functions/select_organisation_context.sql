CREATE OR REPLACE FUNCTION sc_api_edge.select_organisation_context (
  input_user_id    uuid,
  input_session_id uuid,
  input_handle     text
)
  RETURNS jsonb
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
declare
  v_handle text := sc_app.normalise_organisation_handle(input_handle);
  v_organisation_id uuid;
begin
  select org.id into v_organisation_id
  from sc_app.organisations org
  join sc_app.organisation_members member
    on member.organisation_id = org.id
   and member.user_id = input_user_id
  where lower(org.handle) = v_handle;

  if v_organisation_id is null then
    raise exception 'Organisation membership not found' using errcode = '42501';
  end if;

  insert into sc_app.user_session_contexts (session_id, user_id, active_organisation_id)
  values (input_session_id, input_user_id, v_organisation_id)
  on conflict (session_id) do update
    set user_id = excluded.user_id,
        active_organisation_id = excluded.active_organisation_id,
        context_version = sc_app.user_session_contexts.context_version + 1;

  return jsonb_build_object('id', v_organisation_id, 'handle', v_handle);
end;
$function$;

GRANT EXECUTE ON FUNCTION "sc_api_edge"."select_organisation_context"(uuid, uuid, text) TO "postgres", "service_role";

REVOKE ALL ON FUNCTION "sc_api_edge"."select_organisation_context"(uuid, uuid, text) FROM PUBLIC;
