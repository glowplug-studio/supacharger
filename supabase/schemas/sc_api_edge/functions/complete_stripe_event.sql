CREATE OR REPLACE FUNCTION sc_api_edge.complete_stripe_event (
  input_event_id text,
  input_error    text                     DEFAULT NULL::text,
  input_retry_at timestamp with time zone DEFAULT NULL::timestamp WITH time zone
)
  RETURNS void
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
begin
  if input_error is null then
    update sc_app.stripe_events set status = 'processed', processed_at = timezone('utc', now()),
      processing_started_at = null, last_error = null where event_id = input_event_id;
  else
    update sc_app.stripe_events set status = 'failed', processing_started_at = null,
      next_attempt_at = coalesce(input_retry_at, timezone('utc', now()) + interval '1 minute'),
      last_error = left(input_error, 1000) where event_id = input_event_id;
  end if;
end;
$function$;

GRANT EXECUTE ON FUNCTION "sc_api_edge"."complete_stripe_event"(text, text, timestamp WITH time zone) TO "postgres", "service_role";

REVOKE ALL ON FUNCTION "sc_api_edge"."complete_stripe_event"(text, text, timestamp WITH time zone) FROM PUBLIC;
