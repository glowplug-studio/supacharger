CREATE TABLE "sc_app"."billing_accounts" (
  "id"           uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "subject_type" text                     NOT NULL,
  "subject_id"   uuid                     NOT NULL,
  "display_name" text,
  "metadata"     jsonb                    NOT NULL DEFAULT '{}'::jsonb,
  "created_at"   timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  "updated_at"   timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT "billing_accounts_pkey" PRIMARY KEY (id),
  CONSTRAINT "billing_accounts_subject_type_check" CHECK ((subject_type = ANY (ARRAY['user'::text, 'organisation'::text, 'team'::text, 'tenant'::text, 'custom'::text]))),
  CONSTRAINT "billing_accounts_subject_type_subject_id_key" UNIQUE (subject_type, subject_id)
);

ALTER TABLE "sc_app"."billing_accounts"
  ENABLE ROW LEVEL SECURITY;

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "sc_app"."billing_accounts" TO "postgres", "service_role";
