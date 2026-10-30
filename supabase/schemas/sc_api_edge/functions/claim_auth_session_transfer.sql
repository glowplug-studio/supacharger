CREATE OR REPLACE FUNCTION sc_api_edge.claim_auth_session_transfer (
  token_hash text
)
  RETURNS TABLE (
    user_id   uuid,
    next_path text
  )
  LANGUAGE sql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
  update sc_app.auth_session_transfers as transfer
  set consumed_at = statement_timestamp()
  where transfer.token_hash = $1
    and $1 ~ '^[0-9a-f]{64}$'
    and transfer.consumed_at is null
    and transfer.expires_at > statement_timestamp()
    and exists (
      select 1
      from auth.sessions as auth_session
      where auth_session.id = transfer.source_session_id
        and auth_session.user_id = transfer.user_id
    )
  returning transfer.user_id, transfer.next_path;
$function$;

GRANT EXECUTE ON FUNCTION "sc_api_edge"."claim_auth_session_transfer"(text) TO "postgres", "service_role";

COMMENT ON FUNCTION "sc_api_edge"."claim_auth_session_transfer"(text) IS 'Service-role-only atomic one-use claim. Returns only the expected Auth user and stored safe destination while the source session remains live.';

REVOKE ALL ON FUNCTION "sc_api_edge"."claim_auth_session_transfer"(text) FROM PUBLIC;
