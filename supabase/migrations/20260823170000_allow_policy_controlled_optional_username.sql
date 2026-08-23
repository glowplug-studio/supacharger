begin;

create or replace function api.update_account_profile_by_current_user(
  input_first_name text,
  input_last_name text,
  input_username text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
  next_first_name text := btrim(coalesce(input_first_name, ''));
  next_last_name text := btrim(coalesce(input_last_name, ''));
  next_username text := nullif(btrim(coalesce(input_username, '')), '');
begin
  if current_user_id is null or coalesce(((select auth.jwt()) ->> 'is_anonymous')::boolean, false) then
    raise exception 'Verified account required' using errcode = '42501';
  end if;
  if char_length(next_first_name) not between 1 and 100 or char_length(next_last_name) not between 1 and 100 then
    raise exception 'First and last names are required and must be at most 100 characters' using errcode = '22023';
  end if;
  if next_username is not null and next_username !~ '^[A-Za-z0-9_-]{3,40}$' then
    raise exception 'Username must be 3-40 letters, numbers, underscores, or hyphens' using errcode = '22023';
  end if;
  if next_username is not null and exists (
    select 1 from app.profiles profile
    where lower(profile.username) = lower(next_username) and profile.id <> current_user_id
  ) then
    raise exception 'Username is already in use' using errcode = '23505';
  end if;
  update app.profiles profile
  set first_name = next_first_name, last_name = next_last_name, username = next_username
  where profile.id = current_user_id;
end;
$$;

revoke all on function api.update_account_profile_by_current_user(text, text, text) from public, anon;
grant execute on function api.update_account_profile_by_current_user(text, text, text) to authenticated;

comment on function api.update_account_profile_by_current_user(text, text, text) is
  'Updates canonical names and a nullable username. Application configuration decides whether a username is disabled, optional, or required.';

notify pgrst, 'reload schema';

commit;
