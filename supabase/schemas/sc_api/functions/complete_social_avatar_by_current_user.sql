CREATE OR REPLACE FUNCTION sc_api.complete_social_avatar_by_current_user (
  input_avatar_path text DEFAULT NULL::text
)
  RETURNS boolean
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
declare
  actor uuid := auth.uid();
  profile sc_app.profiles%rowtype;
  imported sc_app.social_profile_imports%rowtype;
begin
  if actor is null or coalesce((auth.jwt()->>'is_anonymous')::boolean, false) then
    raise exception 'Authentication required' using errcode = '42501';
  end if;
  select p.* into profile from sc_app.profiles p where p.id = actor for update;
  select s.* into imported from sc_app.social_profile_imports s
  where s.social_profile_import_id = actor for update;
  if not found or imported.completed_at is not null then return false; end if;
  update sc_app.social_profile_imports set completed_at = now() where social_profile_import_id = actor;
  if input_avatar_path is null then return false; end if;
  if imported.created_at < now() - interval '5 minutes'
    or profile.avatar_path is not null
    or profile.updated_at is distinct from imported.profile_updated_at then return false; end if;
  if char_length(input_avatar_path) > 512
    or input_avatar_path not like actor::text || '/avatar-%'
    or input_avatar_path ~ '(^|/)\.\.?(/|$)'
    or not exists (select 1 from storage.objects o where o.bucket_id = 'sc_user-avatars'
      and o.name = input_avatar_path and o.owner_id = actor::text) then
    raise exception 'Invalid avatar path' using errcode = '22023';
  end if;
  update sc_app.profiles p set avatar_path = input_avatar_path where p.id = actor;
  return true;
end;
$function$;

GRANT EXECUTE ON FUNCTION "sc_api"."complete_social_avatar_by_current_user"(text) TO "authenticated", "postgres";

REVOKE ALL ON FUNCTION "sc_api"."complete_social_avatar_by_current_user"(text) FROM PUBLIC;
