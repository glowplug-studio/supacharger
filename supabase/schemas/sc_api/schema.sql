CREATE SCHEMA "sc_api";

GRANT USAGE ON SCHEMA "sc_api" TO "anon", "authenticated";

GRANT CREATE, USAGE ON SCHEMA "sc_api" TO "postgres";

GRANT USAGE ON SCHEMA "sc_api" TO "service_role";
