drop function if exists api.update_account_avatar_by_current_user(text);

create function api.update_account_avatar_by_current_user(input_avatar_path text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  user_id uuid := (select auth.uid());
  next_avatar_path text := nullif(btrim(coalesce(input_avatar_path, '')), '');
begin
  if user_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;
  if next_avatar_path is not null and next_avatar_path not like (user_id::text || '/avatar-%') then
    raise exception 'Avatar path must be inside your profile folder' using errcode = '23514';
  end if;
  update app.profiles profile
  set avatar_path = next_avatar_path
  where profile.id = user_id;
end;
$$;

drop function if exists api.update_account_header_image_by_current_user(text);

create function api.update_account_header_image_by_current_user(input_header_image_path text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
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
  update app.profiles profile
  set header_image_path = next_header_image_path
  where profile.id = user_id;
end;
$$;

revoke all on function api.update_account_avatar_by_current_user(text) from public, anon, authenticated;
revoke all on function api.update_account_header_image_by_current_user(text) from public, anon, authenticated;
grant execute on function api.update_account_avatar_by_current_user(text) to authenticated;
grant execute on function api.update_account_header_image_by_current_user(text) to authenticated;

comment on function api.update_account_avatar_by_current_user(text) is
  'Updates the authenticated account avatar path after validating Storage ownership.';
comment on function api.update_account_header_image_by_current_user(text) is
  'Updates the authenticated account header image path after validating Storage ownership.';
