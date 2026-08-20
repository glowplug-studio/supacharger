begin;

do $$
begin
  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'app' and t.typname = 'application_role'
  ) then
    create type app.application_role as enum ('user', 'admin');
  end if;
end
$$;

create table if not exists app.user_roles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role app.application_role not null default 'user',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

insert into app.user_roles (user_id)
select id from auth.users
on conflict (user_id) do nothing;

alter table app.user_roles enable row level security;
revoke all on table app.user_roles from public, anon, authenticated;
grant select on table app.user_roles to supabase_auth_admin;

drop policy if exists user_roles_auth_hook_read on app.user_roles;
create policy user_roles_auth_hook_read
on app.user_roles
for select
to supabase_auth_admin
using (true);

create or replace function app.handle_auth_user_role()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into app.user_roles (user_id)
  values (new.id)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

revoke execute on function app.handle_auth_user_role()
from public, anon, authenticated;

drop trigger if exists on_auth_user_created_role on auth.users;
create trigger on_auth_user_created_role
after insert on auth.users
for each row execute function app.handle_auth_user_role();

create or replace function app.custom_access_token_hook(event jsonb)
returns jsonb
language plpgsql
stable
security invoker
set search_path = ''
as $$
declare
  claims jsonb := coalesce(event -> 'claims', '{}'::jsonb);
  assigned_role app.application_role;
begin
  select ur.role
  into assigned_role
  from app.user_roles ur
  where ur.user_id = (event ->> 'user_id')::uuid;

  claims := jsonb_set(
    claims,
    '{user_role}',
    to_jsonb(coalesce(assigned_role, 'user'::app.application_role)::text),
    true
  );

  return jsonb_set(event, '{claims}', claims, true);
end;
$$;

revoke execute on function app.custom_access_token_hook(jsonb)
from public, anon, authenticated, service_role;
grant usage on schema app to supabase_auth_admin;
grant execute on function app.custom_access_token_hook(jsonb)
to supabase_auth_admin;

comment on table app.user_roles is
  'Authoritative global application role source for the custom access token hook.';
comment on function app.custom_access_token_hook(jsonb) is
  'Adds the compact user_role claim when Supabase Auth issues or refreshes a JWT.';

commit;
