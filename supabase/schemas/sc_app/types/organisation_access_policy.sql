CREATE TYPE "sc_app"."organisation_access_policy" AS ENUM (
  'closed',
  'request'
);

GRANT USAGE ON TYPE "sc_app"."organisation_access_policy" TO "postgres";
