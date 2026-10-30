CREATE TYPE "sc_app"."pricing_plan_interval" AS ENUM (
  'day',
  'week',
  'month',
  'year'
);

GRANT USAGE ON TYPE "sc_app"."pricing_plan_interval" TO "postgres";
