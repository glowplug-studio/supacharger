-- Required empty-install data and cluster configuration; never export customer data.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('sc_user-avatars', 'sc_user-avatars', false, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('sc_organisation-logos', 'sc_organisation-logos', false, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

ALTER ROLE authenticator SET pgrst.db_schemas = 'graphql_public, sc_api, sc_api_edge';
NOTIFY pgrst, 'reload config';
