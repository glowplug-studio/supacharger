CREATE OR REPLACE FUNCTION sc_api_edge.create_auth_session_transfer (
  user_id              uuid,
  source_session_id    uuid,
  token_hash           text,
  next_path            text,
  requested_expires_at timestamp with time zone
)
  RETURNS TABLE (
    auth_session_transfer_id uuid,
    expires_at               timestamp with time zone
  )
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
declare
  created_transfer_id uuid;
  created_transfer_expiry timestamptz;
  latest_created_at timestamptz;
begin
  if $1 is null or $2 is null or $3 is null or $4 is null or $5 is null then
    raise exception using errcode = '22004', message = 'auth_session_transfer_invalid';
  end if;
  if $3 !~ '^[0-9a-f]{64}$'
    or left($4, 1) <> '/'
    or left($4, 2) = '//'
    or strpos($4, E'\\') > 0
    or $4 ~ '[[:cntrl:]]'
    or $5 <= statement_timestamp()
    or $5 > statement_timestamp() + interval '5 minutes'
  then
    raise exception using errcode = '22023', message = 'auth_session_transfer_invalid';
  end if;

  if not exists (
    select 1
    from auth.sessions as auth_session
    where auth_session.id = $2 and auth_session.user_id = $1
  ) then
    raise exception using errcode = '28000', message = 'auth_session_transfer_source_session_invalid';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended($2::text, 0));

  select transfer.created_at
  into latest_created_at
  from sc_app.auth_session_transfers as transfer
  where transfer.source_session_id = $2
  order by transfer.created_at desc
  limit 1;

  if latest_created_at > statement_timestamp() - interval '10 seconds' then
    raise exception using errcode = 'P0001', message = 'auth_session_transfer_rate_limited';
  end if;

  delete from sc_app.auth_session_transfers as transfer
  where transfer.source_session_id = $2 and transfer.consumed_at is null;

  delete from sc_app.auth_session_transfers as transfer
  where transfer.expires_at < statement_timestamp() - interval '1 day'
     or transfer.consumed_at < statement_timestamp() - interval '1 day';

  insert into sc_app.auth_session_transfers as transfer (
    user_id,
    source_session_id,
    token_hash,
    next_path,
    expires_at
  ) values ($1, $2, $3, $4, $5)
  returning transfer.auth_session_transfer_id, transfer.expires_at
  into created_transfer_id, created_transfer_expiry;

  return query select created_transfer_id, created_transfer_expiry;
end;
$function$;

GRANT EXECUTE ON FUNCTION "sc_api_edge"."create_auth_session_transfer"(uuid, uuid, text, text, timestamp WITH time zone) TO "postgres", "service_role";

COMMENT ON FUNCTION "sc_api_edge"."create_auth_session_transfer"(uuid, uuid, text, text, timestamp with time zone) IS 'Service-role-only creation boundary. Validates a live source Auth session, rotates older grants, and enforces issuance and expiry limits.';

REVOKE ALL ON FUNCTION "sc_api_edge"."create_auth_session_transfer"(uuid, uuid, text, text, timestamp WITH time zone) FROM PUBLIC;
