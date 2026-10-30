CREATE TABLE "sc_app"."entitlement_grants" (
  "id"                 uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "billing_account_id" uuid                     NOT NULL,
  "feature_lookup_key" text                     NOT NULL,
  "source"             text                     NOT NULL,
  "source_reference"   text,
  "active"             boolean                  NOT NULL DEFAULT true,
  "starts_at"          timestamp with time zone,
  "ends_at"            timestamp with time zone,
  "metadata"           jsonb                    NOT NULL DEFAULT '{}'::jsonb,
  "created_at"         timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  "updated_at"         timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT "entitlement_grants_billing_account_id_fkey" FOREIGN KEY (billing_account_id) REFERENCES sc_app.billing_accounts(id) ON DELETE CASCADE,
  CONSTRAINT "entitlement_grants_feature_lookup_key_fkey" FOREIGN KEY (feature_lookup_key) REFERENCES sc_app.billing_features(lookup_key) ON DELETE CASCADE,
  CONSTRAINT "entitlement_grants_pkey" PRIMARY KEY (id),
  CONSTRAINT "entitlement_grants_source_check" CHECK ((source = ANY (ARRAY['stripe_entitlement'::text, 'subscription'::text, 'manual'::text, 'promotion'::text])))
);

ALTER TABLE "sc_app"."entitlement_grants"
  ENABLE ROW LEVEL SECURITY;

CREATE INDEX entitlement_grants_active_idx ON sc_app.entitlement_grants USING btree (billing_account_id, feature_lookup_key)
  WHERE (active IS TRUE);

CREATE UNIQUE INDEX entitlement_grants_source_key ON sc_app.entitlement_grants USING btree (billing_account_id, feature_lookup_key, source, COALESCE(source_reference, ''::text));

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "sc_app"."entitlement_grants" TO "postgres", "service_role";
