-- Allocation is independent of social-picture import and onboarding enforcement.
create table app.profile_username_initialisations (
  profile_username_initialisation_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table app.profile_username_initialisations enable row level security;
revoke all on app.profile_username_initialisations from public, anon, authenticated;

-- Historical edited blanks may represent deliberate removals. Never backfill them.
insert into app.profile_username_initialisations(profile_username_initialisation_id)
select p.id from app.profiles p
where nullif(btrim(p.username), '') is null and p.updated_at is distinct from p.created_at;

create function app.record_profile_username_edit()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into app.profile_username_initialisations(profile_username_initialisation_id)
  values (new.id) on conflict do nothing;
  return new;
end;
$$;
revoke all on function app.record_profile_username_edit() from public, anon, authenticated;
create trigger record_profile_username_edit before update of username on app.profiles
for each row execute function app.record_profile_username_edit();

create function api.initialise_account_username_by_current_user()
returns text language plpgsql security definer set search_path = '' as $$
declare
  actor uuid := auth.uid();
  existing_username text;
  account_email text;
  base_username text;
  candidate text;
  suffix text;
  attempt integer := 0;
  inserted_id uuid;
begin
  if actor is null or coalesce((auth.jwt()->>'is_anonymous')::boolean, false) then
    raise exception 'Authentication required' using errcode = '42501';
  end if;
  select p.username into existing_username from app.profiles p where p.id = actor for update;
  if not found then return null; end if;
  if nullif(btrim(existing_username), '') is not null then return existing_username; end if;
  if exists(select 1 from app.profile_username_initialisations i where i.profile_username_initialisation_id = actor) then return null; end if;
  select u.email into account_email from auth.users u where u.id = actor;
  if nullif(btrim(account_email), '') is null then return null; end if;
  base_username := left(regexp_replace(lower(split_part(account_email, '@', 1)), '[^a-z0-9]', '', 'g'), 40);
  if char_length(base_username) < 3 then base_username := 'user'; end if;
  insert into app.profile_username_initialisations(profile_username_initialisation_id)
  values (actor) on conflict do nothing returning profile_username_initialisation_id into inserted_id;
  if inserted_id is null then return null; end if;

  -- The unique index is authoritative, including races against manual edits.
  loop
    suffix := case when attempt = 0 then '' else attempt::text end;
    candidate := left(base_username, 40 - char_length(suffix)) || suffix;
    if not exists(select 1 from app.profiles p where lower(p.username) = candidate) then
      begin
        update app.profiles p set username = candidate where p.id = actor;
        return candidate;
      exception when unique_violation then
        -- A concurrent allocator or editor claimed this candidate; try the next.
      end;
    end if;
    attempt := attempt + 1;
    if attempt > 10000 then
      raise exception 'Username allocation exhausted' using errcode = '54000';
    end if;
  end loop;
end;
$$;
revoke all on function api.initialise_account_username_by_current_user() from public, anon;
grant execute on function api.initialise_account_username_by_current_user() to authenticated;
notify pgrst, 'reload schema';
