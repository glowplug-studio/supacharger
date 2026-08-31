create table app.auth_session_transfers (
  auth_session_transfer_id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  source_session_id uuid not null,
  token_hash text not null,
  next_path text not null,
  expires_at timestamptz not null,
  consumed_at timestamptz,
  created_at timestamptz not null default statement_timestamp(),
  constraint auth_session_transfers_token_hash_format_check
    check (token_hash ~ '^[0-9a-f]{64}$'),
  constraint auth_session_transfers_expiry_order_check
    check (expires_at > created_at),
  constraint auth_session_transfers_expiry_limit_check
    check (expires_at <= created_at + interval '5 minutes'),
  constraint auth_session_transfers_next_path_check
    check (
      left(next_path, 1) = '/'
      and left(next_path, 2) <> '//'
      and strpos(next_path, E'\\') = 0
      and next_path !~ '[[:cntrl:]]'
    )
);

comment on table app.auth_session_transfers is
  'Private short-lived, single-use browser session-transfer grants. Only SHA-256 grant digests are stored.';
comment on column app.auth_session_transfers.source_session_id is
  'Supabase Auth session that issued the grant; create and claim require the matching auth.sessions row.';
comment on column app.auth_session_transfers.token_hash is
  'Lowercase hexadecimal SHA-256 digest of the user-visible random grant.';

create unique index auth_session_transfers_token_hash_key
  on app.auth_session_transfers (token_hash);
create index auth_session_transfers_source_session_id_idx
  on app.auth_session_transfers (source_session_id);
create index auth_session_transfers_expires_at_idx
  on app.auth_session_transfers (expires_at);

alter table app.auth_session_transfers enable row level security;
revoke all on table app.auth_session_transfers from public, anon, authenticated;

create or replace function api_edge.create_auth_session_transfer(
  user_id uuid,
  source_session_id uuid,
  token_hash text,
  next_path text,
  requested_expires_at timestamptz
)
returns table (
  auth_session_transfer_id uuid,
  expires_at timestamptz
)
language plpgsql
volatile
security definer
set search_path = ''
as $$
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
  from app.auth_session_transfers as transfer
  where transfer.source_session_id = $2
  order by transfer.created_at desc
  limit 1;

  if latest_created_at > statement_timestamp() - interval '10 seconds' then
    raise exception using errcode = 'P0001', message = 'auth_session_transfer_rate_limited';
  end if;

  delete from app.auth_session_transfers as transfer
  where transfer.source_session_id = $2 and transfer.consumed_at is null;

  delete from app.auth_session_transfers as transfer
  where transfer.expires_at < statement_timestamp() - interval '1 day'
     or transfer.consumed_at < statement_timestamp() - interval '1 day';

  insert into app.auth_session_transfers as transfer (
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
$$;

comment on function api_edge.create_auth_session_transfer(uuid, uuid, text, text, timestamptz) is
  'Service-role-only creation boundary. Validates a live source Auth session, rotates older grants, and enforces issuance and expiry limits.';

create or replace function api_edge.claim_auth_session_transfer(token_hash text)
returns table (
  user_id uuid,
  next_path text
)
language sql
volatile
security definer
set search_path = ''
as $$
  update app.auth_session_transfers as transfer
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
$$;

comment on function api_edge.claim_auth_session_transfer(text) is
  'Service-role-only atomic one-use claim. Returns only the expected Auth user and stored safe destination while the source session remains live.';

revoke all on function api_edge.create_auth_session_transfer(uuid, uuid, text, text, timestamptz)
  from public, anon, authenticated;
revoke all on function api_edge.claim_auth_session_transfer(text)
  from public, anon, authenticated;
grant execute on function api_edge.create_auth_session_transfer(uuid, uuid, text, text, timestamptz)
  to service_role;
grant execute on function api_edge.claim_auth_session_transfer(text)
  to service_role;
