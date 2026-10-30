CREATE POLICY "core_profile_media_public" ON "storage"."objects"
  FOR SELECT
  TO "anon"
  USING
    (((bucket_id = 'sc_user-avatars'::text) AND storage.allow_any_operation(ARRAY['object.get_authenticated'::text, 'object.get_authenticated_info'::text,
    'object.head_authenticated_info'::text]) AND
    ((name = (sc_api.get_public_account_profile(split_part(name, '/'::text, 1)) ->> 'avatar_path'::text)) OR (name = (sc_api.get_public_account_profile(split_part(name, '/'::text,
    1)) ->> 'header_image_path'::text)))));

CREATE POLICY "organisation_logos_delete_managers" ON "storage"."objects"
  FOR DELETE
  TO "authenticated"
  USING (((bucket_id = 'sc_organisation-logos'::text) AND ((storage.foldername(name))[2] = ANY (ARRAY['logos'::text, 'headers'::text])) AND sc_app.can_manage_organisation(
CASE
    WHEN ((storage.foldername(name))[1] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'::text) THEN ((storage.foldername(name))[1])::uuid
    ELSE NULL::uuid
END, ( SELECT auth.uid() AS uid))));

CREATE POLICY "organisation_logos_insert_managers" ON "storage"."objects"
  FOR INSERT
  TO "authenticated"
  WITH
    CHECK
    (((bucket_id = 'sc_organisation-logos'::text) AND ((storage.foldername(name))[2] = ANY (ARRAY['logos'::text, 'headers'::text])) AND (array_length(storage.foldername(name), 1) =
    3) AND sc_app.can_manage_organisation(
CASE
    WHEN ((storage.foldername(name))[1] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'::text) THEN ((storage.foldername(name))[1])::uuid
    ELSE NULL::uuid
END, ( SELECT auth.uid() AS uid))));

CREATE POLICY "organisation_logos_select_members" ON "storage"."objects"
  FOR SELECT
  TO "authenticated"
  USING (((bucket_id = 'sc_organisation-logos'::text) AND ((storage.foldername(name))[2] = ANY (ARRAY['logos'::text, 'headers'::text])) AND sc_app.is_organisation_member(
CASE
    WHEN ((storage.foldername(name))[1] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'::text) THEN ((storage.foldername(name))[1])::uuid
    ELSE NULL::uuid
END, ( SELECT auth.uid() AS uid))));

CREATE POLICY "organisation_logos_update_managers" ON "storage"."objects"
  FOR UPDATE
  TO "authenticated"
  USING (((bucket_id = 'sc_organisation-logos'::text) AND ((storage.foldername(name))[2] = ANY (ARRAY['logos'::text, 'headers'::text])) AND sc_app.can_manage_organisation(
CASE
    WHEN ((storage.foldername(name))[1] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'::text) THEN ((storage.foldername(name))[1])::uuid
    ELSE NULL::uuid
END, ( SELECT auth.uid() AS uid))))
  WITH
    CHECK
    (((bucket_id = 'sc_organisation-logos'::text) AND ((storage.foldername(name))[2] = ANY (ARRAY['logos'::text, 'headers'::text])) AND (array_length(storage.foldername(name), 1) =
    3) AND sc_app.can_manage_organisation(
CASE
    WHEN ((storage.foldername(name))[1] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'::text) THEN ((storage.foldername(name))[1])::uuid
    ELSE NULL::uuid
END, ( SELECT auth.uid() AS uid))));

CREATE POLICY "user_avatars_delete_own" ON "storage"."objects"
  FOR DELETE
  TO "authenticated"
  USING (((bucket_id = 'sc_user-avatars'::text) AND ((storage.foldername(name))[1] = (( SELECT auth.uid() AS uid))::text)));

CREATE POLICY "user_avatars_insert_own" ON "storage"."objects"
  FOR INSERT
  TO "authenticated"
  WITH
    CHECK
    (((bucket_id = 'sc_user-avatars'::text) AND ((storage.foldername(name))[1] = (( SELECT auth.uid() AS uid))::text) AND (COALESCE(((( SELECT auth.jwt() AS jwt) ->>
    'is_anonymous'::text))::boolean, false) = false)));

CREATE POLICY "user_avatars_select_authenticated" ON "storage"."objects"
  FOR SELECT
  TO "authenticated"
  USING (((bucket_id = 'sc_user-avatars'::text) AND (COALESCE(((( SELECT auth.jwt() AS jwt) ->> 'is_anonymous'::text))::boolean, false) = false)));

CREATE POLICY "user_avatars_update_own" ON "storage"."objects"
  FOR UPDATE
  TO "authenticated"
  USING (((bucket_id = 'sc_user-avatars'::text) AND ((storage.foldername(name))[1] = (( SELECT auth.uid() AS uid))::text)))
  WITH CHECK (((bucket_id = 'sc_user-avatars'::text) AND ((storage.foldername(name))[1] = (( SELECT auth.uid() AS uid))::text)));
