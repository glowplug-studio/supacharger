CREATE TYPE "sc_app"."application_role" AS ENUM (
  'user',
  'admin'
);

GRANT USAGE ON TYPE "sc_app"."application_role" TO "postgres";
