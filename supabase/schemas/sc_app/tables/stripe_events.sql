CREATE TABLE "sc_app"."stripe_events" (
  "event_id"              text                     NOT NULL,
  "event_type"            text                     NOT NULL,
  "object_id"             text,
  "api_version"           text,
  "livemode"              boolean                  NOT NULL,
  "status"                text                     NOT NULL DEFAULT 'pending'::text,
  "attempt_count"         integer                  NOT NULL DEFAULT 0,
  "received_at"           timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  "processing_started_at" timestamp with time zone,
  "processed_at"          timestamp with time zone,
  "next_attempt_at"       timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  "last_error"            text,
  CONSTRAINT "stripe_events_attempt_count_check" CHECK ((attempt_count >= 0)),
  CONSTRAINT "stripe_events_pkey" PRIMARY KEY (event_id),
  CONSTRAINT "stripe_events_status_check" CHECK ((status = ANY (ARRAY['pending'::text, 'processing'::text, 'processed'::text, 'failed'::text])))
);

ALTER TABLE "sc_app"."stripe_events"
  ENABLE ROW LEVEL SECURITY;

CREATE INDEX stripe_events_retryable_idx ON sc_app.stripe_events USING btree (next_attempt_at, received_at)
  WHERE (status = ANY (ARRAY['pending'::text, 'failed'::text]));

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "sc_app"."stripe_events" TO "postgres", "service_role";
