CREATE TABLE "sc_app"."stripe_customer_mappings" (
  "stripe_customer_mapping_id" uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "billing_account_id"         uuid                     NOT NULL,
  "stripe_customer_id"         text                     NOT NULL,
  "stripe_account_id"          text                     NOT NULL DEFAULT 'platform'::text,
  "livemode"                   boolean,
  "billing_address"            jsonb,
  "payment_method"             jsonb,
  "created_at"                 timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  "updated_at"                 timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT "stripe_customer_mappings_account_mode_key" UNIQUE (billing_account_id, stripe_account_id, livemode),
  CONSTRAINT "stripe_customer_mappings_billing_account_id_fkey" FOREIGN KEY (billing_account_id) REFERENCES sc_app.billing_accounts(id) ON DELETE CASCADE,
  CONSTRAINT "stripe_customer_mappings_external_customer_key" UNIQUE (stripe_customer_id, stripe_account_id),
  CONSTRAINT "stripe_customer_mappings_pkey" PRIMARY KEY (stripe_customer_mapping_id)
);

ALTER TABLE "sc_app"."stripe_customer_mappings"
  ENABLE ROW LEVEL SECURITY;

CREATE INDEX stripe_customer_mappings_billing_account_idx ON sc_app.stripe_customer_mappings USING btree (billing_account_id);

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "sc_app"."stripe_customer_mappings" TO "postgres", "service_role";
