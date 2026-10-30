CREATE OR REPLACE FUNCTION sc_api_edge.billing_user_can_manage (
  input_billing_account_id uuid,
  input_user_id            uuid
)
  RETURNS boolean
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
  select exists (
    select 1 from sc_app.billing_account_members m
    where m.billing_account_id = input_billing_account_id
      and m.user_id = input_user_id
      and m.role in ('owner', 'billing_admin')
  );
$function$;

GRANT EXECUTE ON FUNCTION "sc_api_edge"."billing_user_can_manage"(uuid, uuid) TO "postgres", "service_role";

REVOKE ALL ON FUNCTION "sc_api_edge"."billing_user_can_manage"(uuid, uuid) FROM PUBLIC;
