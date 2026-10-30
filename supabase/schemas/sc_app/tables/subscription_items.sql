CREATE TABLE "sc_app"."subscription_items" (
  "id"                   text                     NOT NULL,
  "subscription_id"      text                     NOT NULL,
  "price_id"             text                     NOT NULL,
  "quantity"             integer,
  "metadata"             jsonb                    NOT NULL DEFAULT '{}'::jsonb,
  "current_period_start" timestamp with time zone NOT NULL,
  "current_period_end"   timestamp with time zone NOT NULL,
  "created_at"           timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  "updated_at"           timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT "subscription_items_pkey" PRIMARY KEY (id),
  CONSTRAINT "subscription_items_price_id_fkey" FOREIGN KEY (price_id) REFERENCES sc_app.prices(id),
  CONSTRAINT "subscription_items_subscription_id_fkey" FOREIGN KEY (subscription_id) REFERENCES sc_app.subscriptions(id) ON DELETE CASCADE
);

ALTER TABLE "sc_app"."subscription_items"
  ENABLE ROW LEVEL SECURITY;

CREATE INDEX subscription_items_price_idx ON sc_app.subscription_items USING btree (price_id);

CREATE INDEX subscription_items_subscription_idx ON sc_app.subscription_items USING btree (subscription_id);

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "sc_app"."subscription_items" TO "postgres", "service_role";
