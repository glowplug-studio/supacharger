CREATE TABLE "sc_app"."billing_features" (
  "lookup_key"  text                     NOT NULL,
  "name"        text                     NOT NULL,
  "description" text,
  "metadata"    jsonb                    NOT NULL DEFAULT '{}'::jsonb,
  "created_at"  timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  "updated_at"  timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT "billing_features_lookup_key_check" CHECK ((lookup_key ~ '^[A-Za-z0-9_.:-]{1,80}$'::text)),
  CONSTRAINT "billing_features_pkey" PRIMARY KEY (lookup_key)
);

ALTER TABLE "sc_app"."billing_features"
  ENABLE ROW LEVEL SECURITY;

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "sc_app"."billing_features" TO "postgres", "service_role";
