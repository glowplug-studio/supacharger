CREATE OR REPLACE FUNCTION sc_api.update_account_header_image_by_current_user (
  input_header_image_path text
)
  RETURNS void
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
declare
  user_id uuid := (select auth.uid());
  next_header_image_path text := nullif(btrim(coalesce(input_header_image_path, '')), '');
begin
  if user_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;
  if next_header_image_path is not null and next_header_image_path not like (user_id::text || '/headers/header-%') then
    raise exception 'Header path must be inside your profile header folder' using errcode = '23514';
  end if;
  update sc_app.profiles profile
  set header_image_path = next_header_image_path
  where profile.id = user_id;
end;
$function$;

GRANT EXECUTE ON FUNCTION "sc_api"."update_account_header_image_by_current_user"(text) TO "authenticated", "postgres";

COMMENT ON FUNCTION "sc_api"."update_account_header_image_by_current_user"(text) IS 'Updates the authenticated account header image path after validating Storage ownership.';

REVOKE ALL ON FUNCTION "sc_api"."update_account_header_image_by_current_user"(text) FROM PUBLIC;
