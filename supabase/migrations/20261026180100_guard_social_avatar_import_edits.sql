-- Legacy consumers do not all touch updated_at on every identity/media write.
-- An explicit edit (including clearing an already-empty avatar) wins over import.
create function app.cancel_social_profile_import_on_edit()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  insert into app.social_profile_imports(social_profile_import_id, completed_at)
  values (new.id, now())
  on conflict (social_profile_import_id) do update set completed_at = now();
  return new;
end;
$$;
revoke all on function app.cancel_social_profile_import_on_edit() from public, anon, authenticated;
create trigger cancel_social_profile_import_on_edit
before update of first_name, last_name, avatar_path on app.profiles
for each row execute function app.cancel_social_profile_import_on_edit();
