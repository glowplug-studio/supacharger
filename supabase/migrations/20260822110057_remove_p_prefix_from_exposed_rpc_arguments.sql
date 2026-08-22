-- Rename legacy p_-prefixed input arguments and align the two shared access
-- arguments with the canonical input_* contract, without touching application data.
--
-- PostgreSQL identifies a function by schema, name, and input types rather than
-- argument names, so argument names cannot be changed with CREATE OR REPLACE.
-- This migration snapshots each affected routine and its privileges, drops the
-- exact signature without CASCADE, recreates it with descriptive argument names,
-- then restores ownership, comments, and grants. Any dependent object that was
-- not accounted for makes the transaction fail safely.

begin;

set local check_function_bodies = off;

create temporary table rpc_argument_rename_functions on commit drop as
select
  p.oid as original_oid,
  n.nspname as schema_name,
  p.proname as function_name,
  pg_catalog.oidvectortypes(p.proargtypes) as identity_types,
  pg_catalog.pg_get_functiondef(p.oid) as definition,
  pg_catalog.pg_get_userbyid(p.proowner) as owner_name,
  pg_catalog.obj_description(p.oid, 'pg_proc') as object_comment
from pg_catalog.pg_proc p
join pg_catalog.pg_namespace n on n.oid = p.pronamespace
where n.nspname in ('api', 'api_edge', 'mcp_api')
  and exists (
    select 1
    from unnest(coalesce(p.proargnames, array[]::text[])) with ordinality as argument(argument_name, position)
    where argument.position <= p.pronargs
      and (
        argument.argument_name like 'p\_%' escape '\'
        or (p.proname = 'is_profile_complete_by_current_user' and argument.argument_name = 'username_required')
        or (p.proname = 'has_billing_access_by_current_user' and argument.argument_name = 'feature_lookup_key')
      )
  );

create temporary table rpc_argument_rename_grants on commit drop as
select
  p.oid as original_oid,
  case
    when acl.grantee = 0 then 'PUBLIC'
    else quote_ident(pg_catalog.pg_get_userbyid(acl.grantee))
  end as grantee_name,
  acl.privilege_type,
  acl.is_grantable
from rpc_argument_rename_functions target
join pg_catalog.pg_proc p on p.oid = target.original_oid
cross join lateral aclexplode(coalesce(p.proacl, acldefault('f', p.proowner))) acl;

do $migration$
declare
  target record;
  saved_grant record;
  renamed_definition text;
begin
  for target in
    select *
    from rpc_argument_rename_functions
    order by schema_name, function_name, identity_types
  loop
    renamed_definition := target.definition;
    if target.function_name = 'is_profile_complete_by_current_user' then
      renamed_definition := regexp_replace(renamed_definition, '\musername_required\M', 'input_username_required', 'g');
    elsif target.function_name = 'has_billing_access_by_current_user' then
      renamed_definition := regexp_replace(renamed_definition, '\mfeature_lookup_key\M', 'input_feature_lookup_key', 'g');
    end if;
    renamed_definition := regexp_replace(
      regexp_replace(renamed_definition, '\mp_limit\M', 'result_limit', 'g'),
      '\mp_([[:alpha:]][[:alnum:]_]*)\M',
      'input_\1',
      'g'
    );

    begin
      execute format(
        'drop function %I.%I(%s)',
        target.schema_name,
        target.function_name,
        target.identity_types
      );
    exception
      when dependent_objects_still_exist then
        raise exception using
          message = format(
            'Cannot safely rename arguments for %I.%I(%s): dependent objects must be migrated explicitly.',
            target.schema_name,
            target.function_name,
            target.identity_types
          ),
          hint = 'No CASCADE is used; the transaction has made no persistent changes.';
    end;

    execute renamed_definition;
    execute format(
      'alter function %I.%I(%s) owner to %I',
      target.schema_name,
      target.function_name,
      target.identity_types,
      target.owner_name
    );
    execute format(
      'revoke all on function %I.%I(%s) from public',
      target.schema_name,
      target.function_name,
      target.identity_types
    );

    for saved_grant in
      select *
      from rpc_argument_rename_grants
      where original_oid = target.original_oid
      order by grantee_name, privilege_type
    loop
      execute format(
        'grant %s on function %I.%I(%s) to %s%s',
        saved_grant.privilege_type,
        target.schema_name,
        target.function_name,
        target.identity_types,
        saved_grant.grantee_name,
        case when saved_grant.is_grantable then ' with grant option' else '' end
      );
    end loop;

    execute format(
      'comment on function %I.%I(%s) is %L',
      target.schema_name,
      target.function_name,
      target.identity_types,
      target.object_comment
    );
  end loop;

  if exists (
    select 1
    from pg_catalog.pg_proc p
    join pg_catalog.pg_namespace n on n.oid = p.pronamespace
    cross join lateral unnest(coalesce(p.proargnames, array[]::text[]))
      with ordinality as argument(argument_name, position)
    where n.nspname in ('api', 'api_edge', 'mcp_api')
      and argument.position <= p.pronargs
      and argument.argument_name like 'p\_%' escape '\'
  ) then
    raise exception 'Exposed RPC arguments with the legacy p_ prefix remain; rolling back.';
  end if;

  if exists (
    select 1
    from pg_catalog.pg_proc p
    join pg_catalog.pg_namespace n on n.oid = p.pronamespace
    cross join lateral unnest(coalesce(p.proargnames, array[]::text[]))
      with ordinality as argument(argument_name, position)
    where n.nspname in ('api', 'api_edge', 'mcp_api')
      and argument.position <= p.pronargs
      and (
        (p.proname = 'is_profile_complete_by_current_user' and argument.argument_name = 'username_required')
        or (p.proname = 'has_billing_access_by_current_user' and argument.argument_name = 'feature_lookup_key')
      )
  ) then
    raise exception 'Shared access RPC argument names remain non-canonical; rolling back.';
  end if;
end
$migration$;

notify pgrst, 'reload schema';

commit;
