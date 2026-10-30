CREATE TABLE "sc_app"."user_session_contexts" (
  "session_id"             uuid                     NOT NULL,
  "user_id"                uuid                     NOT NULL,
  "active_organisation_id" uuid                     NOT NULL,
  "context_version"        bigint                   NOT NULL DEFAULT 1,
  "created_at"             timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  "updated_at"             timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT "user_session_contexts_active_organisation_id_fkey" FOREIGN KEY (active_organisation_id) REFERENCES sc_app.organisations(id) ON DELETE CASCADE,
  CONSTRAINT "user_session_contexts_pkey" PRIMARY KEY (session_id),
  CONSTRAINT "user_session_contexts_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

ALTER TABLE "sc_app"."user_session_contexts"
  ENABLE ROW LEVEL SECURITY;

CREATE INDEX user_session_contexts_user_id_idx ON sc_app.user_session_contexts USING btree (user_id);

CREATE TRIGGER user_session_contexts_touch_updated_at
  BEFORE UPDATE ON sc_app.user_session_contexts
  FOR EACH ROW
  EXECUTE FUNCTION sc_app.touch_updated_at();

CREATE POLICY "user_session_contexts_auth_hook_read" ON "sc_app"."user_session_contexts"
  FOR SELECT
  TO "supabase_auth_admin"
  USING (true);

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "sc_app"."user_session_contexts" TO "postgres", "service_role";

GRANT SELECT ON TABLE "sc_app"."user_session_contexts" TO "supabase_auth_admin";
