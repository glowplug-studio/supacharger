-- Developer-owned example. Copy the body into a NEW forward migration; do not
-- edit an applied migration. Return only compact, product-owned claims.
-- Canonical Supabase, role, and active-organisation claim names are reserved.

create or replace function app.custom_access_token_claims_extension(
  event jsonb,
  canonical_claims jsonb
)
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$
  select jsonb_build_object(
    'product_plan', coalesce(plan.lookup_key, 'free')
  )
  from app.product_user_plans plan
  where plan.user_id = (event ->> 'user_id')::uuid;
$$;

-- Grant only the minimum table privileges and RLS policy needed by
-- supabase_auth_admin, then preserve the narrow function grants:
revoke execute on function app.custom_access_token_claims_extension(jsonb, jsonb)
from public, anon, authenticated, service_role;
grant execute on function app.custom_access_token_claims_extension(jsonb, jsonb)
to supabase_auth_admin;
