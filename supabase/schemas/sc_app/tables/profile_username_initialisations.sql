CREATE TABLE "sc_app"."profile_username_initialisations" (
  "profile_username_initialisation_id" uuid                     NOT NULL,
  "created_at"                         timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "profile_username_initialisati_profile_username_initialisat_fkey" FOREIGN KEY (profile_username_initialisation_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT "profile_username_initialisations_pkey" PRIMARY KEY (profile_username_initialisation_id)
);

ALTER TABLE "sc_app"."profile_username_initialisations"
  ENABLE ROW LEVEL SECURITY;

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "sc_app"."profile_username_initialisations" TO "postgres";
