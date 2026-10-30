CREATE TABLE "sc_services"."bindings" (
  "binding_id"       uuid         NOT NULL DEFAULT gen_random_uuid(),
  "service_name"     text         NOT NULL,
  "operation"        text         NOT NULL,
  "implementation"   text         NOT NULL,
  "contract_version" integer      NOT NULL,
  "handler"          regprocedure NOT NULL,
  CONSTRAINT "bindings_contract_version_check" CHECK ((contract_version = 1)),
  CONSTRAINT "bindings_implementation_check" CHECK ((implementation ~ '^supacharger-ext-[a-z][a-z0-9-]*$'::text)),
  CONSTRAINT "bindings_operation_check" CHECK ((operation ~ '^[a-z][a-z0-9_]{0,63}$'::text)),
  CONSTRAINT "bindings_pkey" PRIMARY KEY (binding_id),
  CONSTRAINT "bindings_service_name_check" CHECK ((service_name ~ '^[a-z][a-z0-9_]{0,63}$'::text)),
  CONSTRAINT "bindings_service_name_operation_key" UNIQUE (service_name, operation)
);

ALTER TABLE "sc_services"."bindings"
  ENABLE ROW LEVEL SECURITY;

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "sc_services"."bindings" TO "postgres";
