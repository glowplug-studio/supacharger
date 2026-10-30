CREATE TYPE "sc_app"."organisation_access_request_status" AS ENUM (
  'pending',
  'approved',
  'rejected',
  'cancelled'
);

GRANT USAGE ON TYPE "sc_app"."organisation_access_request_status" TO "postgres";
