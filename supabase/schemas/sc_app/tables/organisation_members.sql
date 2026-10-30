CREATE TABLE "sc_app"."organisation_members" (
  "organisation_id" uuid                     NOT NULL,
  "user_id"         uuid                     NOT NULL,
  "created_at"      timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  "updated_at"      timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT "organisation_members_pkey" PRIMARY KEY (organisation_id, user_id),
  CONSTRAINT "organisation_members_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT "organisation_members_organisation_id_fkey" FOREIGN KEY (organisation_id) REFERENCES sc_app.organisations(id) ON DELETE CASCADE
);

ALTER TABLE "sc_app"."organisation_members"
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE "sc_app"."organisation_members"
  ADD COLUMN "role" sc_app.organisation_role NOT NULL DEFAULT 'member'::sc_app.organisation_role;

CREATE INDEX organisation_members_user_id_idx ON sc_app.organisation_members USING btree (user_id);

CREATE TRIGGER organisation_members_touch_updated_at
  BEFORE UPDATE ON sc_app.organisation_members
  FOR EACH ROW
  EXECUTE FUNCTION sc_app.touch_updated_at();

CREATE POLICY "organisation_members_auth_hook_read" ON "sc_app"."organisation_members"
  FOR SELECT
  TO "supabase_auth_admin"
  USING (true);

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "sc_app"."organisation_members" TO "postgres", "service_role";

GRANT SELECT ON TABLE "sc_app"."organisation_members" TO "supabase_auth_admin";
