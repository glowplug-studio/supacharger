CREATE OR REPLACE FUNCTION sc_internal.update_account_profile_extension (
  account_id uuid,
  extension  jsonb
)
  RETURNS void
  LANGUAGE plpgsql
  SET search_path TO ''
  AS $function$
begin
  if extension <> '{}'::jsonb then
    raise exception 'Unsupported profile extension fields' using errcode = '22023';
  end if;
end;
$function$;

GRANT EXECUTE ON FUNCTION "sc_internal"."update_account_profile_extension"(uuid, jsonb) TO "postgres";

REVOKE ALL ON FUNCTION "sc_internal"."update_account_profile_extension"(uuid, jsonb) FROM PUBLIC;
