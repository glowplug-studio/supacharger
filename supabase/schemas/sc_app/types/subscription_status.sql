CREATE TYPE "sc_app"."subscription_status" AS ENUM (
  'trialing',
  'active',
  'canceled',
  'incomplete',
  'incomplete_expired',
  'past_due',
  'unpaid',
  'paused'
);

GRANT USAGE ON TYPE "sc_app"."subscription_status" TO "postgres";
