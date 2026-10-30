CREATE OR REPLACE FUNCTION sc_api_edge.list_claimable_stripe_events (
  result_limit integer DEFAULT 20
)
  RETURNS TABLE (
    event_id text
  )
  LANGUAGE sql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
  select e.event_id from sc_app.stripe_events e
  where (e.status in ('pending', 'failed') and e.next_attempt_at <= timezone('utc', now()))
    or (e.status = 'processing' and e.processing_started_at < timezone('utc', now()) - interval '5 minutes')
  order by e.received_at limit least(greatest(coalesce(result_limit, 20), 1), 100);
$function$;

GRANT EXECUTE ON FUNCTION "sc_api_edge"."list_claimable_stripe_events"(integer) TO "postgres", "service_role";

REVOKE ALL ON FUNCTION "sc_api_edge"."list_claimable_stripe_events"(integer) FROM PUBLIC;
