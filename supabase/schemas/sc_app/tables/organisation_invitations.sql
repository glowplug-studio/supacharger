CREATE TABLE "sc_app"."organisation_invitations" (
  "id"              uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "organisation_id" uuid                     NOT NULL,
  "email"           text                     NOT NULL,
  "token_hash"      text                     NOT NULL,
  "invited_by"      uuid                     NOT NULL,
  "accepted_by"     uuid,
  "accepted_at"     timestamp with time zone,
  "revoked_at"      timestamp with time zone,
  "expires_at"      timestamp with time zone NOT NULL DEFAULT (timezone('utc'::text, now()) + '14 days'::interval),
  "created_at"      timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  "updated_at"      timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT "organisation_invitations_acceptance" CHECK ((((accepted_at IS NULL) AND (accepted_by IS NULL)) OR ((accepted_at IS NOT NULL) AND (accepted_by IS NOT NULL)))),
  CONSTRAINT "organisation_invitations_accepted_by_fkey" FOREIGN KEY (accepted_by) REFERENCES auth.users(id),
  CONSTRAINT "organisation_invitations_email_normalised" CHECK (((email = lower(btrim(email))) AND (email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'::text))),
  CONSTRAINT "organisation_invitations_invited_by_fkey" FOREIGN KEY (invited_by) REFERENCES auth.users(id),
  CONSTRAINT "organisation_invitations_pkey" PRIMARY KEY (id),
  CONSTRAINT "organisation_invitations_token_hash" CHECK ((token_hash ~ '^[0-9a-f]{64}$'::text)),
  CONSTRAINT "organisation_invitations_organisation_id_fkey" FOREIGN KEY (organisation_id) REFERENCES sc_app.organisations(id) ON DELETE CASCADE
);

ALTER TABLE "sc_app"."organisation_invitations"
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE "sc_app"."organisation_invitations"
  ADD COLUMN "role" sc_app.organisation_role NOT NULL DEFAULT 'member'::sc_app.organisation_role;

ALTER TABLE "sc_app"."organisation_invitations"
  ADD CONSTRAINT "organisation_invitations_non_owner_role" CHECK ((role <> 'owner'::sc_app.organisation_role));

CREATE UNIQUE INDEX organisation_invitations_pending_email_key ON sc_app.organisation_invitations USING btree (organisation_id, lower(email))
  WHERE ((accepted_at IS NULL) AND (revoked_at IS NULL));

CREATE UNIQUE INDEX organisation_invitations_token_hash_key ON sc_app.organisation_invitations USING btree (token_hash);

CREATE TRIGGER organisation_invitations_touch_updated_at
  BEFORE UPDATE ON sc_app.organisation_invitations
  FOR EACH ROW
  EXECUTE FUNCTION sc_app.touch_updated_at();

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "sc_app"."organisation_invitations" TO "postgres", "service_role";
