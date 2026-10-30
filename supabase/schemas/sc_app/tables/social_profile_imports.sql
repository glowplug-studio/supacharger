CREATE TABLE "sc_app"."social_profile_imports" (
  "social_profile_import_id" uuid                     NOT NULL,
  "profile_updated_at"       timestamp with time zone,
  "created_at"               timestamp with time zone NOT NULL DEFAULT now(),
  "completed_at"             timestamp with time zone,
  CONSTRAINT "social_profile_imports_pkey" PRIMARY KEY (social_profile_import_id),
  CONSTRAINT "social_profile_imports_social_profile_import_id_fkey" FOREIGN KEY (social_profile_import_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

ALTER TABLE "sc_app"."social_profile_imports"
  ENABLE ROW LEVEL SECURITY;

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "sc_app"."social_profile_imports" TO "postgres";
