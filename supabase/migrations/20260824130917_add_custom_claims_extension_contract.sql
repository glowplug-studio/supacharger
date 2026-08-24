begin;

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
  select '{}'::jsonb;
$$;

revoke execute on function app.custom_access_token_claims_extension(jsonb, jsonb)
from public, anon, authenticated, service_role;
grant usage on schema app to supabase_auth_admin;
grant execute on function app.custom_access_token_claims_extension(jsonb, jsonb)
to supabase_auth_admin;

comment on function app.custom_access_token_claims_extension(jsonb, jsonb) is
  'Developer extension seam for additional compact JWT claims. Return only product-owned claims; canonical and Supabase claims are reserved.';

create or replace function app.custom_access_token_hook(event jsonb)
returns jsonb
language plpgsql
stable
security invoker
set search_path = ''
as $$
declare
  claims jsonb := coalesce(event -> 'claims', '{}'::jsonb);
  extension_claims jsonb;
  conflicting_claim text;
  assigned_role app.application_role;
  v_session_id uuid := nullif(claims ->> 'session_id', '')::uuid;
  v_organisation_id uuid;
  v_context_version bigint;
  v_handle text;
  v_organisation_role app.organisation_role;
begin
  select ur.role into assigned_role
  from app.user_roles ur
  where ur.user_id = (event ->> 'user_id')::uuid;

  claims := jsonb_set(
    claims,
    '{user_role}',
    to_jsonb(coalesce(assigned_role, 'user'::app.application_role)::text),
    true
  );

  if v_session_id is not null then
    select context.active_organisation_id, context.context_version, org.handle, member.role
    into v_organisation_id, v_context_version, v_handle, v_organisation_role
    from app.user_session_contexts context
    join app.organisations org on org.id = context.active_organisation_id
    join app.organisation_members member
      on member.organisation_id = context.active_organisation_id
     and member.user_id = context.user_id
    where context.session_id = v_session_id
      and context.user_id = (event ->> 'user_id')::uuid;
  end if;

  if v_organisation_id is null then
    claims := claims
      - 'active_organisation_id'
      - 'active_organisation_handle'
      - 'active_organisation_role'
      - 'organisation_context_version';
  else
    claims := jsonb_set(claims, '{active_organisation_id}', to_jsonb(v_organisation_id::text), true);
    claims := jsonb_set(claims, '{active_organisation_handle}', to_jsonb(v_handle), true);
    claims := jsonb_set(claims, '{active_organisation_role}', to_jsonb(v_organisation_role::text), true);
    claims := jsonb_set(claims, '{organisation_context_version}', to_jsonb(v_context_version), true);
  end if;

  extension_claims := coalesce(app.custom_access_token_claims_extension(event, claims), '{}'::jsonb);
  if jsonb_typeof(extension_claims) <> 'object' then
    raise exception 'custom_access_token_claims_extension must return a JSON object'
      using errcode = '22023';
  end if;

  select extension.key into conflicting_claim
  from jsonb_object_keys(extension_claims) as extension(key)
  where extension.key = any (array[
    'iss', 'aud', 'exp', 'iat', 'sub', 'role', 'aal', 'session_id',
    'email', 'phone', 'is_anonymous', 'jti', 'nbf', 'app_metadata',
    'user_metadata', 'amr', 'user_role', 'active_organisation_id',
    'active_organisation_handle', 'active_organisation_role',
    'organisation_context_version'
  ])
  limit 1;

  if conflicting_claim is not null then
    raise exception 'custom claim name "%" is reserved', conflicting_claim
      using errcode = '22023';
  end if;

  claims := claims || extension_claims;
  return jsonb_set(event, '{claims}', claims, true);
end;
$$;

revoke execute on function app.custom_access_token_hook(jsonb)
from public, anon, authenticated, service_role;
grant execute on function app.custom_access_token_hook(jsonb)
to supabase_auth_admin;

comment on function app.custom_access_token_hook(jsonb) is
  'Adds canonical role and active-organisation claims, then merges validated product claims from the developer extension seam.';

commit;
