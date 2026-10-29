begin;
-- Database-role overrides take precedence over the hosted Data API configuration.
alter role authenticator set pgrst.db_schemas = 'graphql_public, sc_api, sc_api_edge';
notify pgrst, 'reload config';
notify pgrst, 'reload schema';
commit;
