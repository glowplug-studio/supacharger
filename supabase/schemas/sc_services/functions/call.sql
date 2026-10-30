CREATE OR REPLACE FUNCTION sc_services.call (
  service_name text,
  operation    text,
  input        jsonb
)
  RETURNS jsonb
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
declare handler record; result jsonb;
begin
  select p.*,n.nspname into handler from sc_services.bindings b
  join pg_proc p on p.oid=b.handler::oid join pg_namespace n on n.oid=p.pronamespace
  where b.service_name=call.service_name and b.operation=call.operation and b.contract_version=1;
  if not found then raise exception 'Required core service is unavailable' using errcode='55000'; end if;
  if handler.prokind<>'f' or handler.proretset or handler.pronargs<>1 or handler.proargtypes<>'3802'::oidvector
    or handler.prorettype<>'jsonb'::regtype or handler.provariadic<>0 or handler.pronargdefaults<>0
    or handler.nspname in ('public','api','api_edge','mcp_api','sc_api','sc_api_edge','sc_mcp_api') then
    raise exception 'Invalid core service binding' using errcode='55000'; end if;
  execute format('select %I.%I($1)',handler.nspname,handler.proname) into result using input;
  return result;
end;
$function$;

GRANT EXECUTE ON FUNCTION "sc_services"."call"(text, text, jsonb) TO "postgres";

REVOKE ALL ON FUNCTION "sc_services"."call"(text, text, jsonb) FROM PUBLIC;
