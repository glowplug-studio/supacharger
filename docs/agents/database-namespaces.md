# Database and resource namespaces

Read `PROJECT_NAMESPACE` from developer-owned `src/supacharger.config.ts` before creating any application table, schema, bucket, worker, Vault entry or custom Edge secret. An empty string selects `sc_`; `wake` selects `sc_wake_`. Non-empty codes must match `^[a-z][a-z0-9_]{0,5}$`. Choose once before the first database installation. Changing it later is unsupported.

Do not introduce a namespace JSON file, separate prefix setting or namespace environment variable. Project configuration remains developer-owned; managed source must remain identical across installations.

Use `schemaName('app')`, `schemaName('api')` and `schemaName('api_edge')` from `@/supacharger/namespace` in application code. Use `supabaseResourceName(logicalName, kind)` for buckets, deployed functions, jobs and custom secrets. Pass unprefixed logical names. Tables and RPCs retain their own descriptive names inside the resolved schema; do not repeat the project code on every table or function.

The pure `src/supacharger/namespace.cjs` implementation is shared with Node installation tooling. It validates identifiers and rejects PostgreSQL identifier truncation. It rejects platform schemas: `auth`, `storage`, `public`, `extensions`, `vault`, `cron`, `net` and the other Supabase/PostgreSQL-owned schemas retain their names.

`node src/supacharger/prepare-namespace.cjs` produces `supabase/functions/_shared/supacharger-resources.ts` from project configuration. This is a derived Edge build projection, never an editable setting. Builds regenerate it without connecting to Supabase. Preserve canonical function source folders; deployment entries in `supabase/config.toml` use the resolved deployed name and point to the canonical source entrypoint.

Use `node src/supacharger/generate-database-types.cjs --local` or `--linked` to regenerate the shared database row contracts. The generator queries the resolved schemas and normalises their type keys to logical names. Runtime clients use `@/supacharger/database-types`; code selecting row shapes can retain logical keys from `@/lib/supabase/types`. Include additional application schemas with `--schemas mcp_api` (comma-separated logical names); retain this argument in a consumer’s developer-owned package script when its generated types include product schemas.

## SQL and extension installation

An extension inherits its host application's namespace through the Core literal configuration reader. Its preparation step must render concrete SQL, worker names and secret references before installation. Preserve developer extension configuration and immutable installed migrations. Do not generate SQL, apply migrations or reconcile a remote database during a frontend build.

Review every qualified SQL reference, function body, search path, handler-schema restriction, Auth hook, PostgREST profile header, scheduled command and stored resource reference when migrating an existing installation. Renaming a PostgreSQL schema preserves object identities but does not rewrite text inside function bodies. Storage objects must be copied or moved through the Storage API and verified; never rename Storage catalogue rows directly.

Existing installations require explicit forward migrations and matching application, client, Edge and hosted configuration releases. Do not edit historical migrations. This namespace contract does not provide multiple independent installations inside one Supabase project.

Declarative adoption follows the production namespace cutovers. Until that adoption is verified, migrations remain the maintained database deployment source; do not configure a partial Core-only desired state against a consumer database.
