CREATE OR REPLACE FUNCTION sc_api_edge.bind_organisation_billing_account (
  organisation_id uuid
)
  RETURNS uuid
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
declare
  resolved_billing_account_id uuid;
begin
  insert into sc_app.billing_accounts (subject_type, subject_id, display_name)
  select 'organisation', organisation.id, organisation.name
  from sc_app.organisations organisation
  where organisation.id = $1
  on conflict (subject_type, subject_id) do update
    set display_name = excluded.display_name,
        updated_at = timezone('utc', now())
  returning id into resolved_billing_account_id;

  insert into sc_app.billing_account_members (billing_account_id, user_id, role)
  select resolved_billing_account_id, member.user_id,
    case member.role when 'owner' then 'owner' when 'admin' then 'billing_admin' else 'member' end
  from sc_app.organisation_members member
  where member.organisation_id = $1
  on conflict (billing_account_id, user_id) do update set role = excluded.role;

  delete from sc_app.billing_account_members billing_member
  where billing_member.billing_account_id = resolved_billing_account_id
    and not exists (
      select 1 from sc_app.organisation_members member
      where member.organisation_id = $1 and member.user_id = billing_member.user_id
    );

  return resolved_billing_account_id;
end;
$function$;

GRANT EXECUTE ON FUNCTION "sc_api_edge"."bind_organisation_billing_account"(uuid) TO "postgres", "service_role";

REVOKE ALL ON FUNCTION "sc_api_edge"."bind_organisation_billing_account"(uuid) FROM PUBLIC;
