CREATE TABLE "sc_internal"."profile_media_settings" (
  "profile_media_setting_id" boolean NOT NULL DEFAULT true,
  "supabase_url"             text    NOT NULL,
  CONSTRAINT "profile_media_settings_pkey" PRIMARY KEY (profile_media_setting_id),
  CONSTRAINT "profile_media_settings_profile_media_setting_id_check" CHECK (profile_media_setting_id),
  CONSTRAINT "profile_media_settings_supabase_url_check" CHECK ((supabase_url ~ '^https?://[^/]+$'::text))
);

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "sc_internal"."profile_media_settings" TO "postgres";
