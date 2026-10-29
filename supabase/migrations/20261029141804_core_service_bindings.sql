-- Core owns dispatch only. Implementations own their queues and workers.
create schema if not exists sc_services;
revoke all on schema sc_services from public,anon,authenticated,service_role;
create table sc_services.bindings (
  binding_id uuid primary key default gen_random_uuid(),
  service_name text not null,
  operation text not null,
  implementation text not null check(implementation ~ '^supacharger-ext-[a-z][a-z0-9-]*$'),
  contract_version integer not null check(contract_version=1),
  handler regprocedure not null,
  unique(service_name,operation),
  check(service_name ~ '^[a-z][a-z0-9_]{0,63}$'),
  check(operation ~ '^[a-z][a-z0-9_]{0,63}$')
);
alter table sc_services.bindings enable row level security;
revoke all on sc_services.bindings from public,anon,authenticated,service_role;
create function sc_services.call(service_name text, operation text, input jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare handler record; result jsonb;
begin
  select p.*,n.nspname into handler from sc_services.bindings b
  join pg_proc p on p.oid=b.handler::oid join pg_namespace n on n.oid=p.pronamespace
  where b.service_name=call.service_name and b.operation=call.operation and b.contract_version=1;
  if not found then raise exception 'Required core service is unavailable' using errcode='55000'; end if;
  if handler.prokind<>'f' or handler.proretset or handler.pronargs<>1 or handler.proargtypes<>'3802'::oidvector
    or handler.prorettype<>'jsonb'::regtype or handler.provariadic<>0 or handler.pronargdefaults<>0
    or handler.nspname in ('public','api','api_edge','mcp_api') then
    raise exception 'Invalid core service binding' using errcode='55000'; end if;
  execute format('select %I.%I($1)',handler.nspname,handler.proname) into result using input;
  return result;
end;
$$;
revoke all on function sc_services.call(text,text,jsonb) from public,anon,authenticated,service_role;
