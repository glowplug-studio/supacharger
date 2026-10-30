CREATE OR REPLACE FUNCTION sc_app.custom_access_token_claims_extension (
  event            jsonb,
  canonical_claims jsonb
)
  RETURNS jsonb
  LANGUAGE sql
  STABLE
  SET search_path TO ''
  AS $function$
  select '{}'::jsonb;
$function$;

GRANT EXECUTE ON FUNCTION "sc_app"."custom_access_token_claims_extension"(jsonb, jsonb) TO "postgres", "supabase_auth_admin";

COMMENT ON FUNCTION "sc_app"."custom_access_token_claims_extension"(jsonb, jsonb) IS 'Developer extension seam for additional compact JWT claims. Return only product-owned claims; canonical and Supabase claims are reserved.';

REVOKE ALL ON FUNCTION "sc_app"."custom_access_token_claims_extension"(jsonb, jsonb) FROM PUBLIC;
