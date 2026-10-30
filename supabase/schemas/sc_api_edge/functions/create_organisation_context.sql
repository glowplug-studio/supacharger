CREATE OR REPLACE FUNCTION sc_api_edge.create_organisation_context (
  input_user_id    uuid,
  input_session_id uuid,
  input_name       text,
  input_handle     text
)
  RETURNS jsonb
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
declare
  v_name text := btrim(coalesce(input_name, ''));
  v_handle text := sc_app.normalise_organisation_handle(input_handle);
  v_organisation_id uuid;
begin
  if input_user_id is null or input_session_id is null then
    raise exception 'User and session are required' using errcode = '22023';
  end if;
  if v_name = '' or v_handle !~ '^[a-z0-9][a-z0-9-]{1,62}[a-z0-9]$' then
    raise exception 'Enter a name and a valid 3-64 character handle' using errcode = '22023';
  end if;

  insert into sc_app.organisations (name, handle, created_by)
  values (v_name, v_handle, input_user_id)
  returning id into v_organisation_id;

  insert into sc_app.organisation_members (organisation_id, user_id, role)
  values (v_organisation_id, input_user_id, 'owner');

  insert into sc_app.user_session_contexts (session_id, user_id, active_organisation_id)
  values (input_session_id, input_user_id, v_organisation_id)
  on conflict (session_id) do update
    set user_id = excluded.user_id,
        active_organisation_id = excluded.active_organisation_id,
        context_version = sc_app.user_session_contexts.context_version + 1;

  return jsonb_build_object('id', v_organisation_id, 'handle', v_handle);
end;
$function$;

GRANT EXECUTE ON FUNCTION "sc_api_edge"."create_organisation_context"(uuid, uuid, text, text) TO "postgres", "service_role";

REVOKE ALL ON FUNCTION "sc_api_edge"."create_organisation_context"(uuid, uuid, text, text) FROM PUBLIC;
