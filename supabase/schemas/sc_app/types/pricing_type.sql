CREATE TYPE "sc_app"."pricing_type" AS ENUM (
  'one_time',
  'recurring'
);

GRANT USAGE ON TYPE "sc_app"."pricing_type" TO "postgres";
