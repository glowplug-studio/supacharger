CREATE TABLE "sc_app"."prices" (
  "id"                text    NOT NULL,
  "product_id"        text,
  "active"            boolean,
  "description"       text,
  "unit_amount"       bigint,
  "currency"          text,
  "interval_count"    integer,
  "trial_period_days" integer,
  "metadata"          jsonb,
  CONSTRAINT "prices_currency_check" CHECK (((currency IS NULL) OR (char_length(currency) = 3))),
  CONSTRAINT "prices_pkey" PRIMARY KEY (id),
  CONSTRAINT "prices_product_id_fkey" FOREIGN KEY (product_id) REFERENCES sc_app.products(id) ON DELETE CASCADE
);

ALTER TABLE "sc_app"."prices"
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE "sc_app"."prices"
  ADD COLUMN "interval" sc_app.pricing_plan_interval;

ALTER TABLE "sc_app"."prices"
  ADD COLUMN "type" sc_app.pricing_type;

CREATE POLICY "prices_read" ON "sc_app"."prices"
  FOR SELECT
  TO "anon", "authenticated"
  USING (true);

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "sc_app"."prices" TO "postgres", "service_role";
