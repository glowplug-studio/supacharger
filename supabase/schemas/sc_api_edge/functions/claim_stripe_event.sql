CREATE OR REPLACE FUNCTION sc_api_edge.claim_stripe_event (
  input_event_id text
)
  RETURNS jsonb
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
declare v_payload jsonb;
begin
  update sc_app.stripe_events set status = 'processing', attempt_count = attempt_count + 1,
    processing_started_at = timezone('utc', now()), last_error = null
  where event_id = input_event_id and (
    (status in ('pending', 'failed') and next_attempt_at <= timezone('utc', now()))
    or (status = 'processing' and processing_started_at < timezone('utc', now()) - interval '5 minutes')
  );
  if not found then return null; end if;
  select payload into v_payload from sc_app.stripe_event_payloads where event_id = input_event_id;
  return v_payload;
end;
$function$;

GRANT EXECUTE ON FUNCTION "sc_api_edge"."claim_stripe_event"(text) TO "postgres", "service_role";

REVOKE ALL ON FUNCTION "sc_api_edge"."claim_stripe_event"(text) FROM PUBLIC;
