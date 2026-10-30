CREATE TABLE "sc_app"."profiles" (
  "id"                uuid                     NOT NULL,
  "first_name"        text                     NOT NULL DEFAULT ''::text,
  "last_name"         text                     NOT NULL DEFAULT ''::text,
  "username"          text,
  "email"             text,
  "avatar_path"       text,
  "header_image_path" text,
  "language_code"     text,
  "created_at"        timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  "updated_at"        timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  "profile_is_public" boolean                  NOT NULL DEFAULT false,
  CONSTRAINT "profiles_avatar_path_owner" CHECK (((avatar_path IS NULL) OR (avatar_path ~~ ((id)::text || '/avatar-%'::text)))),
  CONSTRAINT "profiles_first_name_check" CHECK ((char_length(first_name) <= 100)),
  CONSTRAINT "profiles_header_image_path_owner" CHECK (((header_image_path IS NULL) OR (header_image_path ~~ ((id)::text || '/headers/header-%'::text)))),
  CONSTRAINT "profiles_id_fkey" FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT "profiles_language_code_check" CHECK (((language_code IS NULL) OR (language_code ~ '^[a-z]{2}$'::text))),
  CONSTRAINT "profiles_last_name_check" CHECK ((char_length(last_name) <= 100)),
  CONSTRAINT "profiles_pkey" PRIMARY KEY (id),
  CONSTRAINT "profiles_username_format" CHECK (((username IS NULL) OR (username ~ '^[A-Za-z0-9_-]{3,40}$'::text)))
);

ALTER TABLE "sc_app"."profiles"
  ENABLE ROW LEVEL SECURITY;

CREATE UNIQUE INDEX profiles_username_lower_key ON sc_app.profiles USING btree (lower(username))
  WHERE (username IS NOT NULL);

CREATE TRIGGER cancel_social_profile_import_on_edit
  BEFORE UPDATE OF first_name, last_name, avatar_path ON sc_app.profiles
  FOR EACH ROW
  EXECUTE FUNCTION sc_app.cancel_social_profile_import_on_edit();

CREATE TRIGGER profiles_touch_updated_at
  BEFORE UPDATE ON sc_app.profiles
  FOR EACH ROW
  EXECUTE FUNCTION sc_app.touch_updated_at();

CREATE TRIGGER record_profile_username_edit
  BEFORE UPDATE OF username ON sc_app.profiles
  FOR EACH ROW
  EXECUTE FUNCTION sc_app.record_profile_username_edit();

CREATE POLICY "profiles_select_own" ON "sc_app"."profiles"
  FOR SELECT
  TO "authenticated"
  USING ((( SELECT auth.uid() AS uid) = id));

CREATE POLICY "profiles_update_own" ON "sc_app"."profiles"
  FOR UPDATE
  TO "authenticated"
  USING ((( SELECT auth.uid() AS uid) = id))
  WITH CHECK ((( SELECT auth.uid() AS uid) = id));

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "sc_app"."profiles" TO "postgres", "service_role";
