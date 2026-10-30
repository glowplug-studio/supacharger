CREATE OR REPLACE FUNCTION sc_api.get_account_summary_by_current_user()
  RETURNS jsonb
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
  with current_identity as (
    select (select auth.uid()) as user_id,
      nullif((select auth.jwt()) ->> 'session_id', '')::uuid as session_id
  ), active_organisation as (
    select
      organisation.id,
      organisation.handle,
      organisation.name,
      member.role
    from current_identity identity
    join sc_app.user_session_contexts context
      on context.session_id = identity.session_id
     and context.user_id = identity.user_id
    join sc_app.organisations organisation
      on organisation.id = context.active_organisation_id
    join sc_app.organisation_members member
      on member.organisation_id = organisation.id
     and member.user_id = identity.user_id
  )
  select case
    when identity.user_id is null
      or coalesce(((select auth.jwt()) ->> 'is_anonymous')::boolean, false)
      then null
    else jsonb_build_object(
      'user_id', profile.id,
      'email', profile.email,
      'first_name', profile.first_name,
      'last_name', profile.last_name,
      'username', profile.username,
      'avatar_path', profile.avatar_path,
      'active_organisation', (
        select jsonb_build_object(
          'id', organisation.id,
          'handle', organisation.handle,
          'name', organisation.name,
          'role', organisation.role,
          'avatar_path', null
        )
        from active_organisation organisation
      ),
      'organisation_count', (
        select count(*)
        from sc_app.organisation_members member
        where member.user_id = identity.user_id
      )
    )
  end
  from current_identity identity
  join sc_app.profiles profile on profile.id = identity.user_id;
$function$;

GRANT EXECUTE ON FUNCTION "sc_api"."get_account_summary_by_current_user"() TO "authenticated", "postgres";

COMMENT ON FUNCTION "sc_api"."get_account_summary_by_current_user"() IS 'Returns the authenticated account identity and active organisation summary in one query. Media values are storage paths and must be signed by a trusted application boundary.';

REVOKE ALL ON FUNCTION "sc_api"."get_account_summary_by_current_user"() FROM PUBLIC;
