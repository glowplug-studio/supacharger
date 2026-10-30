CREATE OR REPLACE FUNCTION sc_api_edge.accept_stripe_event (
  input_event_id    text,
  input_event_type  text,
  input_object_id   text,
  input_api_version text,
  input_livemode    boolean,
  input_payload     jsonb
)
  RETURNS boolean
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
declare inserted_count integer;
begin
  insert into sc_app.stripe_events (event_id, event_type, object_id, api_version, livemode)
  values (input_event_id, input_event_type, input_object_id, input_api_version, input_livemode)
  on conflict (event_id) do nothing;
  get diagnostics inserted_count = row_count;
  if inserted_count = 0 then return false; end if;
  insert into sc_app.stripe_event_payloads (event_id, payload) values (input_event_id, input_payload);
  return true;
end;
$function$;

GRANT EXECUTE ON FUNCTION "sc_api_edge"."accept_stripe_event"(text, text, text, text, boolean, jsonb) TO "postgres", "service_role";

REVOKE ALL ON FUNCTION "sc_api_edge"."accept_stripe_event"(text, text, text, text, boolean, jsonb) FROM PUBLIC;
