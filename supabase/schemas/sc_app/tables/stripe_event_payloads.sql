CREATE TABLE "sc_app"."stripe_event_payloads" (
  "event_id"   text                     NOT NULL,
  "payload"    jsonb                    NOT NULL,
  "expires_at" timestamp with time zone NOT NULL DEFAULT (timezone('utc'::text, now()) + '30 days'::interval),
  CONSTRAINT "stripe_event_payloads_pkey" PRIMARY KEY (event_id),
  CONSTRAINT "stripe_event_payloads_event_id_fkey" FOREIGN KEY (event_id) REFERENCES sc_app.stripe_events(event_id) ON DELETE CASCADE
);

ALTER TABLE "sc_app"."stripe_event_payloads"
  ENABLE ROW LEVEL SECURITY;

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "sc_app"."stripe_event_payloads" TO "postgres", "service_role";
