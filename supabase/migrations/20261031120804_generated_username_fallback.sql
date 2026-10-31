SET local check_function_bodies = off;

DROP FUNCTION "sc_api"."initialise_account_username_by_current_user"();

CREATE OR REPLACE FUNCTION sc_api.initialise_account_username_by_current_user (
  fallback_username text
)
  RETURNS text
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
declare
  actor uuid := auth.uid();
  existing_username text;
  account_email text;
  base_username text;
  candidate text;
  suffix text;
  attempt integer := 0;
  inserted_id uuid;
  using_email boolean := false;
begin
  if actor is null or coalesce((auth.jwt()->>'is_anonymous')::boolean, false) then
    raise exception 'Authentication required' using errcode = '42501';
  end if;
  select p.username into existing_username from sc_app.profiles p where p.id = actor for update;
  if not found then return null; end if;
  if nullif(btrim(existing_username), '') is not null then return existing_username; end if;
  if exists(select 1 from sc_app.profile_username_initialisations i where i.profile_username_initialisation_id = actor) then return null; end if;
  select u.email into account_email from auth.users u where u.id = actor;
  if fallback_username is null or fallback_username !~ '^[a-z0-9_-]{3,40}$' then
    raise exception 'Invalid fallback username' using errcode = '22023';
  end if;
  base_username := regexp_replace(lower(split_part(coalesce(account_email, ''), '@', 1)), '[^a-z0-9_-]', '', 'g');
  using_email := char_length(base_username) between 3 and 40;
  if not using_email then base_username := fallback_username; end if;
  insert into sc_app.profile_username_initialisations(profile_username_initialisation_id)
  values (actor) on conflict do nothing returning profile_username_initialisation_id into inserted_id;
  if inserted_id is null then return null; end if;

  -- The unique index is authoritative, including races against manual edits.
  loop
    suffix := case when attempt = 0 then '' else attempt::text end;
    candidate := left(base_username, 40 - char_length(suffix)) || suffix;
    if not exists(select 1 from sc_app.profiles p where lower(p.username) = candidate) then
      begin
        update sc_app.profiles p set username = candidate where p.id = actor;
        return candidate;
      exception when unique_violation then
        -- A concurrent allocator or editor claimed this candidate; try the next.
      end;
    end if;
    if using_email then
      base_username := fallback_username;
      using_email := false;
      attempt := 0;
      continue;
    end if;
    attempt := attempt + 1;
    if attempt > 10000 then
      raise exception 'Username allocation exhausted' using errcode = '54000';
    end if;
  end loop;
end;
$function$;

REVOKE ALL ON FUNCTION "sc_api"."initialise_account_username_by_current_user"(text) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "sc_api"."initialise_account_username_by_current_user"(text) TO "authenticated";
