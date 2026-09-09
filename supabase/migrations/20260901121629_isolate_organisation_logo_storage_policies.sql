begin;

drop policy if exists organisation_logos_select_members on storage.objects;
drop policy if exists organisation_logos_insert_managers on storage.objects;
drop policy if exists organisation_logos_update_managers on storage.objects;
drop policy if exists organisation_logos_delete_managers on storage.objects;

create policy organisation_logos_select_members
on storage.objects for select to authenticated
using (
  bucket_id = 'organisation-logos'
  and (storage.foldername(name))[2] in ('logos', 'headers')
  and app.is_organisation_member(
    case
      when (storage.foldername(name))[1] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
        then (storage.foldername(name))[1]::uuid
      else null
    end,
    (select auth.uid())
  )
);

create policy organisation_logos_insert_managers
on storage.objects for insert to authenticated
with check (
  bucket_id = 'organisation-logos'
  and (storage.foldername(name))[2] in ('logos', 'headers')
  and array_length(storage.foldername(name), 1) = 3
  and app.can_manage_organisation(
    case
      when (storage.foldername(name))[1] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
        then (storage.foldername(name))[1]::uuid
      else null
    end,
    (select auth.uid())
  )
);

create policy organisation_logos_update_managers
on storage.objects for update to authenticated
using (
  bucket_id = 'organisation-logos'
  and (storage.foldername(name))[2] in ('logos', 'headers')
  and app.can_manage_organisation(
    case
      when (storage.foldername(name))[1] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
        then (storage.foldername(name))[1]::uuid
      else null
    end,
    (select auth.uid())
  )
)
with check (
  bucket_id = 'organisation-logos'
  and (storage.foldername(name))[2] in ('logos', 'headers')
  and array_length(storage.foldername(name), 1) = 3
  and app.can_manage_organisation(
    case
      when (storage.foldername(name))[1] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
        then (storage.foldername(name))[1]::uuid
      else null
    end,
    (select auth.uid())
  )
);

create policy organisation_logos_delete_managers
on storage.objects for delete to authenticated
using (
  bucket_id = 'organisation-logos'
  and (storage.foldername(name))[2] in ('logos', 'headers')
  and app.can_manage_organisation(
    case
      when (storage.foldername(name))[1] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
        then (storage.foldername(name))[1]::uuid
      else null
    end,
    (select auth.uid())
  )
);

commit;
