begin;

insert into app.profiles (
  id,
  first_name,
  last_name,
  username,
  email,
  avatar_path,
  created_at,
  updated_at
)
select
  auth_user.id,
  coalesce(auth_user.raw_user_meta_data ->> 'first_name', ''),
  coalesce(auth_user.raw_user_meta_data ->> 'last_name', ''),
  null,
  auth_user.email,
  case
    when auth_user.raw_user_meta_data ->> 'avatar_path'
      like (auth_user.id::text || '/avatar-%')
      then auth_user.raw_user_meta_data ->> 'avatar_path'
    else null
  end,
  coalesce(auth_user.created_at, timezone('utc', now())),
  timezone('utc', now())
from auth.users auth_user
where not exists (
  select 1
  from app.profiles profile
  where profile.id = auth_user.id
)
on conflict (id) do nothing;

commit;
