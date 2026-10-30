CREATE TYPE "sc_app"."organisation_role" AS ENUM (
  'owner',
  'admin',
  'member'
);

GRANT USAGE ON TYPE "sc_app"."organisation_role" TO "postgres";
