CREATE OR REPLACE FUNCTION sc_api_edge.billing_get_or_create_user_account (
  input_user_id uuid
)
  RETURNS uuid
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
declare v_account_id uuid;
begin
  if not exists (select 1 from sc_app.profiles p where p.id = input_user_id) then
    raise exception 'Billing user does not exist' using errcode = '23503';
  end if;
  insert into sc_app.billing_accounts (id, subject_type, subject_id)
  values (input_user_id, 'user', input_user_id)
  on conflict (subject_type, subject_id) do update set updated_at = timezone('utc', now())
  returning id into v_account_id;
  insert into sc_app.billing_account_members (billing_account_id, user_id, role)
  values (v_account_id, input_user_id, 'owner')
  on conflict (billing_account_id, user_id) do nothing;
  return v_account_id;
end;
$function$;

GRANT EXECUTE ON FUNCTION "sc_api_edge"."billing_get_or_create_user_account"(uuid) TO "postgres", "service_role";

REVOKE ALL ON FUNCTION "sc_api_edge"."billing_get_or_create_user_account"(uuid) FROM PUBLIC;
