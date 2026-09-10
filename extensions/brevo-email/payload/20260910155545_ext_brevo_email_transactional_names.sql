begin;
set local lock_timeout='5s';
-- Rename in place to retain ownership, ACLs, comments and OID dependencies.

alter function brevo_email.dispatch(uuid[]) rename to ext_brevo_transactional_dispatch;

alter function brevo_email.dispatch_inserted() rename to ext_brevo_transactional_dispatch_inserted;

alter function brevo_email.enqueue(jsonb) rename to ext_brevo_transactional_enqueue;

alter function api_edge.brevo_email_enqueue(jsonb) rename to ext_brevo_transactional_enqueue;

alter function api_edge.brevo_email_claim(uuid[]) rename to ext_brevo_transactional_claim;

alter function api_edge.brevo_email_finish(uuid, uuid, boolean) rename to ext_brevo_transactional_finish;

alter function brevo_email.retry_pending() rename to ext_brevo_transactional_retry_pending;

create or replace function brevo_email.ext_brevo_transactional_dispatch(delivery_ids uuid[] default null) returns void
language plpgsql security definer set search_path = '' as $$
declare endpoint text; secret text;
begin
  select s.decrypted_secret into endpoint from vault.decrypted_secrets s where s.name='brevo_email_worker_url';
  select s.decrypted_secret into secret from vault.decrypted_secrets s where s.name='brevo_email_worker_secret';
  -- Installation remains inert until an administrator configures Vault and deploys the worker.
  if endpoint is null or secret is null or length(secret)<32 then return; end if;
  if endpoint !~ '^https://[a-z0-9]+[.]supabase[.]co/functions/v1/ext-brevo-email$' then
    raise exception 'Invalid Brevo worker endpoint';
  end if;
  if delivery_ids is not null and (cardinality(delivery_ids)<1 or cardinality(delivery_ids)>20) then
    raise exception 'Invalid delivery batch';
  end if;
  perform net.http_post(url:=endpoint,
    headers:=jsonb_build_object('Content-Type','application/json','Authorization','Bearer '||secret),
    body:=jsonb_build_object('action','process') || case when delivery_ids is null then '{}'::jsonb else jsonb_build_object('ids',delivery_ids) end,
    timeout_milliseconds:=60000);
exception when others then
  -- The notification stays durable even if network dispatch cannot be registered.
  raise warning 'Brevo dispatch unavailable; notifications remain pending';
end;
$$;

-- Restricted compatibility entry point for existing callers.
create function brevo_email.dispatch(delivery_ids uuid[] default null) returns void
language sql security invoker set search_path='' as $compat$ select brevo_email.ext_brevo_transactional_dispatch($1); $compat$;

revoke all on function brevo_email.dispatch(uuid[]) from public, anon, authenticated, service_role;

comment on function brevo_email.dispatch(uuid[]) is 'Deprecated compatibility alias; use brevo_email.ext_brevo_transactional_dispatch.';

create or replace function brevo_email.ext_brevo_transactional_dispatch_inserted() returns trigger
language plpgsql security definer set search_path = '' as $$
declare batch record;
begin
  for batch in
    select array_agg(x.delivery_id) as ids from (
      select d.delivery_id, (row_number() over (order by d.delivery_id)-1)/20 as bucket from inserted_deliveries d
    ) x group by x.bucket
  loop
    perform brevo_email.ext_brevo_transactional_dispatch(batch.ids);
  end loop;
  return null;
end;
$$;

create or replace function brevo_email.ext_brevo_transactional_enqueue(notifications jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare item jsonb; ids uuid[] := '{}'; existing jsonb;
begin
  if jsonb_typeof(notifications) is distinct from 'array' or jsonb_array_length(notifications) not between 1 and 1000 then
    raise exception 'Expected 1 to 1000 notifications' using errcode='22023';
  end if;
  for item in select value from jsonb_array_elements(notifications) loop
    if jsonb_typeof(item) is distinct from 'object'
      or item - array['id','template','to','params','metadata'] <> '{}'::jsonb
      or coalesce(item->>'id','') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
      or coalesce(item->>'template','') !~ '^[A-Z][A-Z0-9_]{0,63}$'
      or jsonb_typeof(item->'to') is distinct from 'object'
      or (item->'to') - array['email','name'] <> '{}'::jsonb
      or coalesce(item->'to'->>'email','') !~ '^[^[:space:]@<>]+@[^[:space:]@<>]+[.][^[:space:]@<>]+$'
      or length(item->'to'->>'email')>254
      or (item->'to' ? 'name' and (jsonb_typeof(item->'to'->'name') <> 'string' or length(item->'to'->>'name')>200 or item->'to'->>'name' ~ E'[\r\n]'))
      or jsonb_typeof(item->'params') is distinct from 'object'
      or (item ? 'metadata' and jsonb_typeof(item->'metadata') <> 'object')
      or octet_length(item::text)>100000 then
      raise exception 'Invalid notification' using errcode='22023';
    end if;
    if (item->>'id')::uuid=any(ids) then raise exception 'Duplicate notification ID' using errcode='22023'; end if;
    ids:=array_append(ids,(item->>'id')::uuid);
  end loop;
  -- Lock conflicting IDs through ON CONFLICT; a replay must never change content or resend success.
  insert into brevo_email.deliveries(delivery_id, notification)
  select (n.value->>'id')::uuid,n.value from jsonb_array_elements(notifications) n
  on conflict (delivery_id) do nothing;
  for item in select value from jsonb_array_elements(notifications) loop
    select d.notification into existing from brevo_email.deliveries d where d.delivery_id=(item->>'id')::uuid;
    if existing is distinct from item then raise exception 'Notification ID already has different content' using errcode='22023'; end if;
  end loop;
  return to_jsonb(ids);
end;
$$;

-- Restricted compatibility entry point for existing callers.
create function brevo_email.enqueue(notifications jsonb) returns jsonb
language sql security invoker set search_path='' as $compat$ select brevo_email.ext_brevo_transactional_enqueue($1); $compat$;

revoke all on function brevo_email.enqueue(jsonb) from public, anon, authenticated, service_role;

comment on function brevo_email.enqueue(jsonb) is 'Deprecated compatibility alias; use brevo_email.ext_brevo_transactional_enqueue.';

create or replace function api_edge.ext_brevo_transactional_enqueue(notifications jsonb) returns jsonb
language sql security definer set search_path = '' as $$ select brevo_email.ext_brevo_transactional_enqueue(notifications); $$;

-- Restricted compatibility entry point for existing callers.
create function api_edge.brevo_email_enqueue(notifications jsonb) returns jsonb
language sql security invoker set search_path='' as $compat$ select api_edge.ext_brevo_transactional_enqueue($1); $compat$;

revoke all on function api_edge.brevo_email_enqueue(jsonb) from public, anon, authenticated, service_role;

grant execute on function api_edge.brevo_email_enqueue(jsonb) to service_role;

comment on function api_edge.brevo_email_enqueue(jsonb) is 'Deprecated compatibility alias; use api_edge.ext_brevo_transactional_enqueue.';

create or replace function api_edge.ext_brevo_transactional_claim(delivery_ids uuid[] default null) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare jobs jsonb; group_row record; refreshed jsonb; fn_schema text; fn_name text;
begin
  if delivery_ids is not null and (cardinality(delivery_ids)<1 or cardinality(delivery_ids)>20) then
    raise exception 'Invalid delivery batch' using errcode='22023';
  end if;
  with claimed as (
    update brevo_email.deliveries d set claimed_until=clock_timestamp()+interval '5 minutes',
      claim_token=gen_random_uuid(), attempts=d.attempts+1
    where d.delivery_id in (
      select q.delivery_id from brevo_email.deliveries q where q.sent_at is null
      and q.next_attempt_at<=clock_timestamp() and (q.claimed_until is null or q.claimed_until<clock_timestamp())
      and (delivery_ids is null or q.delivery_id=any(delivery_ids))
      order by q.created_at,q.delivery_id limit 20 for update skip locked
    ) returning d.notification,d.claim_token
  ) select coalesce(jsonb_agg(to_jsonb(c)),'[]') into jobs from claimed c;
  for group_row in
    select r.template,r.resolver,jsonb_agg(j.value->'notification') as notifications
    from jsonb_array_elements(jobs) j join brevo_email.resolvers r on r.template=j.value->'notification'->>'template'
    group by r.template,r.resolver
  loop
    select n.nspname,p.proname into fn_schema,fn_name from pg_proc p join pg_namespace n on n.oid=p.pronamespace
    where p.oid=group_row.resolver::oid and p.pronargs=1 and p.proargtypes[0]='jsonb'::regtype and p.prorettype='jsonb'::regtype;
    if fn_name is null then raise exception 'Invalid delivery resolver'; end if;
    execute format('select %I.%I($1)',fn_schema,fn_name) into refreshed using group_row.notifications;
    if jsonb_typeof(refreshed) is distinct from 'array' or jsonb_array_length(refreshed)<>jsonb_array_length(group_row.notifications)
      or exists(select 1 from jsonb_array_elements(group_row.notifications) original
        where (select count(*) from jsonb_array_elements(refreshed) r where r.value->>'id'=original.value->>'id' and r.value->>'template'=group_row.template)<>1)
    then raise exception 'Invalid delivery resolver result'; end if;
    select coalesce(jsonb_agg(case when j.value->'notification'->>'template'=group_row.template
      then jsonb_set(j.value,'{notification}',(select r.value from jsonb_array_elements(refreshed) r where r.value->>'id'=j.value->'notification'->>'id'))
      else j.value end),'[]') into jobs from jsonb_array_elements(jobs) j;
  end loop;
  return jobs;
end;
$$;

-- Restricted compatibility entry point for existing callers.
create function api_edge.brevo_email_claim(delivery_ids uuid[] default null) returns jsonb
language sql security invoker set search_path='' as $compat$ select api_edge.ext_brevo_transactional_claim($1); $compat$;

revoke all on function api_edge.brevo_email_claim(uuid[]) from public, anon, authenticated, service_role;

grant execute on function api_edge.brevo_email_claim(uuid[]) to service_role;

comment on function api_edge.brevo_email_claim(uuid[]) is 'Deprecated compatibility alias; use api_edge.ext_brevo_transactional_claim.';

create or replace function api_edge.ext_brevo_transactional_finish(delivery_id uuid, lease_token uuid, accepted boolean) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if accepted is null then raise exception 'Acceptance required' using errcode='22023'; end if;
  update brevo_email.deliveries d set sent_at=case when accepted then clock_timestamp() else null end,
    claimed_until=null,claim_token=null,
    next_attempt_at=clock_timestamp()+least(interval '1 hour',interval '1 minute'*power(2,least(d.attempts,6)))
  where d.delivery_id=ext_brevo_transactional_finish.delivery_id and d.claim_token=lease_token and d.sent_at is null;
  if not found then raise exception 'Stale delivery lease' using errcode='22023'; end if;
end;
$$;

-- Restricted compatibility entry point for existing callers.
create function api_edge.brevo_email_finish(delivery_id uuid, lease_token uuid, accepted boolean) returns void
language sql security invoker set search_path='' as $compat$ select api_edge.ext_brevo_transactional_finish($1, $2, $3); $compat$;

revoke all on function api_edge.brevo_email_finish(uuid, uuid, boolean) from public, anon, authenticated, service_role;

grant execute on function api_edge.brevo_email_finish(uuid, uuid, boolean) to service_role;

comment on function api_edge.brevo_email_finish(uuid, uuid, boolean) is 'Deprecated compatibility alias; use api_edge.ext_brevo_transactional_finish.';

create or replace function brevo_email.ext_brevo_transactional_retry_pending() returns void
language plpgsql security definer set search_path = '' as $$
begin
  if exists(select 1 from brevo_email.deliveries d where d.sent_at is null and d.next_attempt_at<=clock_timestamp()
    and (d.claimed_until is null or d.claimed_until<clock_timestamp())) then
    perform brevo_email.ext_brevo_transactional_dispatch();
  end if;
end;
$$;

-- Restricted compatibility entry point for existing callers.
create function brevo_email.retry_pending() returns void
language sql security invoker set search_path='' as $compat$ select brevo_email.ext_brevo_transactional_retry_pending(); $compat$;

revoke all on function brevo_email.retry_pending() from public, anon, authenticated, service_role;

comment on function brevo_email.retry_pending() is 'Deprecated compatibility alias; use brevo_email.ext_brevo_transactional_retry_pending.';

-- Preserve the existing job ID, cadence and active state.
select cron.alter_job(jobid, command := 'select brevo_email.ext_brevo_transactional_retry_pending()')
from cron.job where jobname='ext-brevo-email-retry';
notify pgrst,'reload schema';
commit;
