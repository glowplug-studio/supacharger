CREATE TABLE "sc_app"."organisation_access_requests" (
  "id"              uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "organisation_id" uuid                     NOT NULL,
  "requested_by"    uuid                     NOT NULL,
  "reviewed_by"     uuid,
  "reviewed_at"     timestamp with time zone,
  "created_at"      timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  "updated_at"      timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT "organisation_access_requests_pkey" PRIMARY KEY (id),
  CONSTRAINT "organisation_access_requests_requested_by_fkey" FOREIGN KEY (requested_by) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT "organisation_access_requests_reviewed_by_fkey" FOREIGN KEY (reviewed_by) REFERENCES auth.users(id),
  CONSTRAINT "organisation_access_requests_organisation_id_fkey" FOREIGN KEY (organisation_id) REFERENCES sc_app.organisations(id) ON DELETE CASCADE
);

ALTER TABLE "sc_app"."organisation_access_requests"
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE "sc_app"."organisation_access_requests"
  ADD COLUMN "status" sc_app.organisation_access_request_status NOT NULL DEFAULT 'pending'::sc_app.organisation_access_request_status;

ALTER TABLE "sc_app"."organisation_access_requests"
  ADD CONSTRAINT "organisation_access_requests_review"
    CHECK
    ((((status = 'pending'::sc_app.organisation_access_request_status) AND (reviewed_by IS NULL) AND (reviewed_at IS NULL)) OR ((status <>
    'pending'::sc_app.organisation_access_request_status) AND (reviewed_by IS NOT NULL) AND (reviewed_at IS NOT NULL))));

CREATE UNIQUE INDEX organisation_access_requests_pending_user_key ON sc_app.organisation_access_requests USING btree (organisation_id, requested_by)
  WHERE (status = 'pending'::sc_app.organisation_access_request_status);

CREATE INDEX organisation_access_requests_requester_idx ON sc_app.organisation_access_requests USING btree (requested_by, created_at DESC);

CREATE TRIGGER organisation_access_requests_touch_updated_at
  BEFORE UPDATE ON sc_app.organisation_access_requests
  FOR EACH ROW
  EXECUTE FUNCTION sc_app.touch_updated_at();

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "sc_app"."organisation_access_requests" TO "postgres", "service_role";
