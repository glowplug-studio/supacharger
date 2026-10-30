CREATE TABLE "sc_app"."user_roles" (
  "user_id"    uuid                     NOT NULL,
  "created_at" timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  "updated_at" timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT "user_roles_pkey" PRIMARY KEY (user_id),
  CONSTRAINT "user_roles_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

ALTER TABLE "sc_app"."user_roles"
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE "sc_app"."user_roles"
  ADD COLUMN "role" sc_app.application_role NOT NULL DEFAULT 'user'::sc_app.application_role;

CREATE POLICY "user_roles_auth_hook_read" ON "sc_app"."user_roles"
  FOR SELECT
  TO "supabase_auth_admin"
  USING (true);

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "sc_app"."user_roles" TO "postgres";

GRANT SELECT ON TABLE "sc_app"."user_roles" TO "supabase_auth_admin";

COMMENT ON TABLE "sc_app"."user_roles" IS 'Authoritative global application role source for the custom access token hook.';
