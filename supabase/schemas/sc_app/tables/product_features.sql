CREATE TABLE "sc_app"."product_features" (
  "product_id"         text                     NOT NULL,
  "feature_lookup_key" text                     NOT NULL,
  "created_at"         timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT "product_features_feature_lookup_key_fkey" FOREIGN KEY (feature_lookup_key) REFERENCES sc_app.billing_features(lookup_key) ON DELETE CASCADE,
  CONSTRAINT "product_features_pkey" PRIMARY KEY (product_id, feature_lookup_key),
  CONSTRAINT "product_features_product_id_fkey" FOREIGN KEY (product_id) REFERENCES sc_app.products(id) ON DELETE CASCADE
);

ALTER TABLE "sc_app"."product_features"
  ENABLE ROW LEVEL SECURITY;

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "sc_app"."product_features" TO "postgres", "service_role";
