CREATE TABLE "sc_app"."organisations" (
  "id"                uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "name"              text                     NOT NULL,
  "handle"            text                     NOT NULL,
  "created_by"        uuid                     NOT NULL,
  "created_at"        timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  "updated_at"        timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  "bio"               text,
  "colour_hex"        text                     NOT NULL DEFAULT '#2563EB'::text,
  "avatar_path"       text,
  "header_image_path" text,
  CONSTRAINT "organisations_avatar_path_folder" CHECK (((avatar_path IS NULL) OR (avatar_path ~~ ((id)::text || '/logos/%'::text)))),
  CONSTRAINT "organisations_bio_length" CHECK (((bio IS NULL) OR (char_length(bio) <= 300))),
  CONSTRAINT "organisations_colour_hex" CHECK ((colour_hex ~ '^#[0-9A-Fa-f]{6}$'::text)),
  CONSTRAINT "organisations_created_by_fkey" FOREIGN KEY (created_by) REFERENCES auth.users(id),
  CONSTRAINT "organisations_handle_normalised" CHECK (((handle = lower(btrim(handle))) AND (handle ~ '^[a-z0-9][a-z0-9-]{1,62}[a-z0-9]$'::text))),
  CONSTRAINT "organisations_header_image_path_folder" CHECK (((header_image_path IS NULL) OR (header_image_path ~~ ((id)::text || '/headers/%'::text)))),
  CONSTRAINT "organisations_name_not_blank" CHECK ((btrim(name) <> ''::text)),
  CONSTRAINT "organisations_pkey" PRIMARY KEY (id)
);

ALTER TABLE "sc_app"."organisations"
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE "sc_app"."organisations"
  ADD COLUMN "access_policy" sc_app.organisation_access_policy NOT NULL DEFAULT 'closed'::sc_app.organisation_access_policy;

CREATE UNIQUE INDEX organisations_handle_lower_key ON sc_app.organisations USING btree (lower(handle));

CREATE TRIGGER organisations_touch_updated_at
  BEFORE UPDATE ON sc_app.organisations
  FOR EACH ROW
  EXECUTE FUNCTION sc_app.touch_updated_at();

CREATE POLICY "organisations_auth_hook_read" ON "sc_app"."organisations"
  FOR SELECT
  TO "supabase_auth_admin"
  USING (true);

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "sc_app"."organisations" TO "postgres", "service_role";

GRANT SELECT ON TABLE "sc_app"."organisations" TO "supabase_auth_admin";
