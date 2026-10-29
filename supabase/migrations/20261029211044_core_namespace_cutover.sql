-- Default Core namespace. Existing consumers need their own reviewed cutover.
-- Prepare namespaced buckets through the Storage API before the hosted cutover.
-- Deploy the matching Data API/Auth/Edge configuration immediately afterwards.
begin;
set local lock_timeout = '5s';
set local statement_timeout = '60s';

do $preflight$
declare old_name text;
begin
  if to_regprocedure('internal.get_account_profile_extension(uuid)') is null
    or to_regprocedure('sc_services.call(text,text,jsonb)') is null then
    raise exception 'Apply atomic profile extensions and Core service bindings first';
  end if;
  foreach old_name in array array['app','api','api_edge','internal'] loop
    if not exists(select 1 from pg_namespace where nspname=old_name)
      or exists(select 1 from pg_namespace where nspname='sc_'||old_name) then
      raise exception 'Unexpected namespace state for %; inspect before cutover', old_name;
    end if;
  end loop;
  if exists(select 1 from storage.objects where bucket_id in ('user-avatars','organisation-logos')) then
    raise exception 'Storage objects require a separately verified Storage API migration';
  end if;
  if exists(select 1 from app.profiles where avatar_path like '%/user-avatars/%'
    or header_image_path like '%/user-avatars/%')
    or exists(select 1 from app.organisations where avatar_path like '%/organisation-logos/%'
    or header_image_path like '%/organisation-logos/%') then
    raise exception 'Stored absolute media references require an explicit data migration';
  end if;
end;
$preflight$;

-- Renames preserve relation/function identities, dependencies, owners and grants.
alter schema app rename to sc_app;
alter schema api rename to sc_api;
alter schema api_edge rename to sc_api_edge;
alter schema internal rename to sc_internal;
-- sc_services already has the correct default namespace.

create function pg_temp.core_namespaced_sql(source text)
returns text language plpgsql immutable set search_path = '' as $rewrite$
declare old_name text; result text := source;
begin
  if result is null then return null; end if;
  foreach old_name in array array['api_edge','internal','app','api'] loop
    result := regexp_replace(result,
      '(^|[^[:alnum:]_])("' || old_name || '"|' || old_name || ')\.',
      '\1sc_' || old_name || '.', 'g');
  end loop;
  result := replace(result, '''user-avatars''', '''sc_user-avatars''');
  result := replace(result, '''organisation-logos''', '''sc_organisation-logos''');
  result := replace(result, '/functions/v1/profile-media?', '/functions/v1/sc_profile-media?');
  return result;
end;
$rewrite$;

-- PostgreSQL does not rewrite textual PL/pgSQL or SQL function bodies on rename.
-- CREATE OR REPLACE preserves OIDs, ACLs and comments; retain each original owner.
do $functions$
declare item record; definition text;
begin
  for item in
    select p.oid, p.proowner, p.proconfig, pg_get_functiondef(p.oid) as definition
    from pg_proc p join pg_namespace n on n.oid=p.pronamespace
    where n.nspname in ('sc_app','sc_api','sc_api_edge','sc_internal','sc_services','public')
      and p.prokind='f'
  loop
    if exists(select 1 from unnest(item.proconfig) setting
      where setting like 'search_path=%'
      and setting ~ '(^|[=,[:space:]"])(app|api|api_edge|internal)([,[:space:]"]|$)') then
      raise exception 'Legacy function search_path requires review: %', item.oid::regprocedure;
    end if;
    definition := pg_temp.core_namespaced_sql(item.definition);
    if item.oid = 'sc_services.call(text,text,jsonb)'::regprocedure::oid then
      if position('handler.nspname in (''public'',''api'',''api_edge'',''mcp_api'')' in definition)=0 then
        raise exception 'Unexpected Core service dispatcher definition';
      end if;
      definition := replace(definition,
        'handler.nspname in (''public'',''api'',''api_edge'',''mcp_api'')',
        'handler.nspname in (''public'',''api'',''api_edge'',''mcp_api'',''sc_api'',''sc_api_edge'',''sc_mcp_api'')');
    end if;
    if definition is distinct from item.definition then
      execute definition;
      execute format('alter function %s owner to %I', item.oid::regprocedure,
        pg_get_userbyid(item.proowner));
    end if;
  end loop;
end;
$functions$;

-- Parsed schema references follow OIDs automatically; bucket string literals do not.
do $policies$
declare item record; using_sql text; check_sql text; command text;
begin
  for item in select * from pg_policies
    where schemaname in ('storage','sc_app','sc_api','sc_api_edge','sc_internal','sc_services')
  loop
    using_sql := pg_temp.core_namespaced_sql(item.qual);
    check_sql := pg_temp.core_namespaced_sql(item.with_check);
    if using_sql is distinct from item.qual or check_sql is distinct from item.with_check then
      command := format('alter policy %I on %I.%I',item.policyname,item.schemaname,item.tablename);
      if using_sql is not null then command := command || ' using (' || using_sql || ')'; end if;
      if check_sql is not null then command := command || ' with check (' || check_sql || ')'; end if;
      execute command;
    end if;
  end loop;
end;
$policies$;

do $verify$
begin
  if exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace
    where n.nspname in ('sc_app','sc_api','sc_api_edge','sc_internal','sc_services','public')
      and p.prokind='f'
      and pg_get_functiondef(p.oid) ~ '(^|[^[:alnum:]_])("?(app|api|api_edge|internal)"?)\.') then
    raise exception 'A function still references a legacy schema';
  end if;
  if exists(select 1 from pg_policies where schemaname='storage'
    and (coalesce(qual,'') || coalesce(with_check,'')) ~ '''(user-avatars|organisation-logos)''') then
    raise exception 'A Storage policy still references a legacy bucket';
  end if;
end;
$verify$;

drop function pg_temp.core_namespaced_sql(text);
notify pgrst, 'reload schema';
commit;
