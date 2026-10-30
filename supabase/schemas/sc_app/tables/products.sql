CREATE TABLE "sc_app"."products" (
  "id"          text    NOT NULL,
  "active"      boolean,
  "name"        text,
  "description" text,
  "image"       text,
  "metadata"    jsonb,
  CONSTRAINT "products_pkey" PRIMARY KEY (id)
);

ALTER TABLE "sc_app"."products"
  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "products_read" ON "sc_app"."products"
  FOR SELECT
  TO "anon", "authenticated"
  USING (true);

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "sc_app"."products" TO "postgres", "service_role";
