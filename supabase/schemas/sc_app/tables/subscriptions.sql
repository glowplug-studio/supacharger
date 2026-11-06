CREATE TABLE "sc_app"."subscriptions" (
  "subscription_id"       text                     NOT NULL,
  "user_id"               uuid,
  "metadata"              jsonb,
  "price_id"              text,
  "quantity"              integer,
  "cancel_at_period_end"  boolean,
  "created"               timestamp with time zone NOT NULL,
  "current_period_start"  timestamp with time zone NOT NULL,
  "current_period_end"    timestamp with time zone NOT NULL,
  "ended_at"              timestamp with time zone,
  "cancel_at"             timestamp with time zone,
  "canceled_at"           timestamp with time zone,
  "trial_start"           timestamp with time zone,
  "trial_end"             timestamp with time zone,
  "billing_account_id"    uuid                     NOT NULL,
  "stripe_customer_id"    text,
  "livemode"              boolean,
  "collection_method"     text,
  "currency"              text,
  "billing_mode"          text,
  "latest_invoice_id"     text,
  "automatic_tax_enabled" boolean,
  "last_synced_at"        timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT "subscriptions_billing_account_id_fkey" FOREIGN KEY (billing_account_id) REFERENCES sc_app.billing_accounts(id),
  CONSTRAINT "subscriptions_billing_mode_check" CHECK (((billing_mode IS NULL) OR (billing_mode = ANY (ARRAY['classic'::text, 'flexible'::text])))),
  CONSTRAINT "subscriptions_currency_check" CHECK (((currency IS NULL) OR (char_length(currency) = 3))),
  CONSTRAINT "subscriptions_pkey" PRIMARY KEY (subscription_id),
  CONSTRAINT "subscriptions_price_id_fkey" FOREIGN KEY (price_id) REFERENCES sc_app.prices(id),
  CONSTRAINT "subscriptions_user_id_fkey" FOREIGN KEY (user_id) REFERENCES sc_app.profiles(id) ON DELETE CASCADE
);

ALTER TABLE "sc_app"."subscriptions"
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE "sc_app"."subscriptions"
  ADD COLUMN "status" sc_app.subscription_status;

CREATE INDEX subscriptions_billing_account_idx ON sc_app.subscriptions USING btree (billing_account_id, status, current_period_end DESC);

CREATE POLICY "subscriptions_select_own" ON "sc_app"."subscriptions"
  FOR SELECT
  TO "authenticated"
  USING ((( SELECT auth.uid() AS uid) = user_id));

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "sc_app"."subscriptions" TO "postgres", "service_role";
