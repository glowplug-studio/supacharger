CREATE TABLE "sc_app"."customers" (
  "id"                 uuid                     NOT NULL,
  "stripe_customer_id" text                     NOT NULL,
  "billing_address"    jsonb,
  "payment_method"     jsonb,
  "created_at"         timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  "updated_at"         timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT "customers_pkey" PRIMARY KEY (id),
  CONSTRAINT "customers_stripe_customer_id_key" UNIQUE (stripe_customer_id),
  CONSTRAINT "customers_id_fkey" FOREIGN KEY (id) REFERENCES sc_app.profiles(id) ON DELETE CASCADE
);

ALTER TABLE "sc_app"."customers"
  ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER customers_touch_updated_at
  BEFORE UPDATE ON sc_app.customers
  FOR EACH ROW
  EXECUTE FUNCTION sc_app.touch_updated_at();

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "sc_app"."customers" TO "postgres", "service_role";
