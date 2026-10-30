# Declarative database definitions

`supabase/schemas/` contains the complete desired database structure for this application. Core, installed extensions and product objects participate in the same tree. Keep the application's complete tree; replacing it with Core alone can generate destructive removal of product objects.

## Ownership and namespaces

The tree is developer-owned in consumers. Core publishes its default `sc_` starter; review and merge subsequent Core changes into the application's definitions. Extension payloads place their definitions under `supabase/schemas/extensions/<id>/`. Do not declare the same object in two files.

`PROJECT_NAMESPACE` in `src/supacharger.config.ts` is the only namespace input. Before a new installation, run `node src/supacharger/declarative-namespace.cjs` after choosing it. The CLI setup calls the same renderer. Extension declarative SQL is rendered by the extension installer using this property. Default distributed SQL uses valid `sc_` identifiers. Do not manually prefix table names or RPC names, or rewrite historical migrations.

For new tables and functions, use the configured prefix in schema qualifiers. Keep Supabase's platform schemas unchanged. Preserve application-owned Auth triggers and Storage policies alongside the application schemas.

## Migration history remains permanent

Declarative SQL describes structure; `supabase/migrations/` remains the ordered deployment history. Retain installed migration files, names and contents. Never delete the history, mark migrations reverted merely to make a command pass, or apply declarative CREATE statements directly to production.

Data changes, service binding registrations, bucket records, extension enablement and secrets are not ordinary schema definitions. Keep these in explicit forward migrations or their existing secure configuration workflow. Do not export queue contents, customer data or secret values into this tree. Disabling or deleting an extension's frontend does not authorise deleting its database objects or queued work.

## Verification before adoption or deployment

Use the project-pinned Supabase CLI. Export an existing database to an ignored staging directory first; inspect its completeness and compare against migration replay. Establish a successful no-change baseline before adoption. A successful export alone is not adoption.

The pg-delta workflow uses `supabase db schema declarative sync --no-apply -f <change_name>` to generate a migration from desired state versus migration history. Review the generated SQL, rehearse locally, then deploy the reviewed migration. It does not detect edits made directly to production. Verify live drift separately before deployment.

Historical aliases in `.supacharger/migration-aliases.json` are Supacharger metadata; the raw Supabase CLI does not interpret them. Resolve deployment selection against the actual remote ledger, without replaying equivalent migrations under another timestamp. A local historical replay failure must be diagnosed rather than bypassed with a blanket production push.

Keep grants, RLS, function security/search paths, triggers, indexes, comments and extension configuration in the review. No RPC or Bruno change is needed when adoption preserves the exact database contract; changes discovered during comparison require the usual caller and API documentation review.

## Native planning and diagnostic fallback

Try the project-pinned native command first:

```sh
npx --no-install supabase db schema declarative sync --experimental --no-apply -f <change_name>
```

This writes a migration but does not apply it to the application database. It creates disposable shadows and replays history. Use `--no-cache` to distinguish a cached-shadow problem from a fresh replay failure. A non-empty plan can indicate historical drift; it is not evidence of a stalled command. Never deploy that drift automatically.

Define custom cluster roles idempotently in `supabase/roles.sql`, matching their existing attributes and memberships. The native CLI loads this file into both shadows; creating a role only in a historical migration leaves it absent from the declarative shadow. Keep object grants in the desired tree. Do not add privileged role memberships to bypass a replay error.

Earlier native runs stalled, but Core's pinned 2.122.0 completed both cached and uncached verification on 30 October 2026. No upstream defect or cause of the earlier stall was established. Do not assume a single-connection pool is defective or that every application can replay successfully. Verify each application's history and a no-change round trip separately.

For a diagnosed native failure, the project also pins Supabase's Node pg-delta engine and pg-topo and provides a read-only diagnostic fallback:

```sh
npm run db:schema:plan -- --target postgresql://postgres:postgres@127.0.0.1:54322/postgres
```

Use a disposable local database containing the verified current state. This compares that local state to the complete desired tree; unlike native sync, it does **not** reconstruct migration history. Verify that the target represents the deployed baseline first. It writes SQL and a plan artifact under ignored `supabase/.temp/`, never applies the plan, refuses remote endpoints, and never creates a migration automatically. After review, use `supabase migration new <name>` and place only the approved changes in that forward migration. Follow the generated script's transaction instructions.

For pg_cron, supply `--shadow <fresh-local-postgres-url>` on a separate disposable PostgreSQL server whose cron database matches the target database name. SQL loading writes to that shadow. Disable job execution in rehearsal servers; never copy Vault credentials or delivery data. `--allow-cloned-shadow` is only for independently running disposable containers initialised from the same PostgreSQL image, whose system identifiers therefore match; the wrapper requires different local ports. Recreate the shadow before another plan.

Custom cluster roles must exist in both local servers with the same definitions before loading grants. Their creation, membership and other cluster configuration remain in reviewed migrations or `supabase/roles.sql`, separate from the database-scoped schema export. Likewise, bucket rows, bindings, runtime settings and Vault values stay in their existing migration/configuration workflow.

Do not use a generated plan to reconcile unrelated production drift automatically. Keep the native engine enabled in config to prevent the legacy diff engine interpreting this per-object tree. A successful fallback does not certify native historical replay or authorise changing the migration ledger.

