# Declarative database definitions

`supabase/schemas/` contains the complete desired database structure for this application. Core, installed extensions and product objects participate in the same tree. Keep the application's complete tree; replacing it with Core alone can generate destructive removal of product objects.

## Ownership and namespaces

The tree is developer-owned in consumers. Core publishes its default `sc_` starter; review and merge subsequent Core changes into the application's definitions. Extension payloads place their definitions under `supabase/schemas/extensions/<id>/`. Do not declare the same object in two files.

`PROJECT_NAMESPACE` in `src/supacharger.config.ts` is the only namespace input. CLI initialisation captures it before preparing SQL. `supacharger init my-app --namespace wake` selects `sc_wake_`; a non-interactive install without the option stores `''` and uses `sc_`. Interactive installs offer the same default. For a manual fresh download, install the project dependencies, choose the property, then run `node src/supacharger/database-starter.cjs --fresh` before linking Supabase. The helper verifies the distributed definitions and history, renders the desired tree and local Supabase configuration, and replaces only that untouched fresh starter history with one generated initial migration. It refuses linked, customised or stale starters. Do not run it on an existing application. `declarative-namespace.cjs` renders definitions alone; it does not flatten history. Extension declarative SQL is rendered by the extension installer using this property. Default distributed SQL uses valid `sc_` identifiers. Do not manually prefix table names or RPC names, or rewrite historical migrations.

For new tables and functions, use the configured prefix in schema qualifiers. Keep Supabase's platform schemas unchanged. Preserve application-owned Auth triggers and Storage policies alongside the application schemas.

## Protected Core database contracts

Developer ownership of the combined SQL files does **not** grant permission to change Core's database contract. Before editing a Core-defined table, column, constraint, index, function, trigger, RLS policy, grant or security setting, compare it with the installed Core revision and apply the Supacharger Core approval gate. Implement approved shared changes in canonical Core first. Never redefine a Core object in a second product or extension file to bypass this protection.

Product tables and supported extension fields/hooks remain project-owned, including when they share a prefixed schema with Core. Preserve them during updates. Adding a product field does not make the rest of a Core table project-owned. Changes to project database contracts still follow the project approval gate. Schema names alone do not establish ownership.

## Updating projects with different histories

Core's maintainer history and each application's history may differ. The installed Core commit supplies the old definitions; incoming Core supplies the new definitions; the complete application tree supplies local additions. The CLI renders both Core versions with the existing namespace and merges those three versions. It stops on overlapping edits, conflicting new objects or customised removals before replacing files. Product-only files and extension definitions remain in place. Pre-merge copies are saved under ignored `supabase/.temp/core-schema-backup-*`.

For a Core release with `src/supacharger/database-starter/contract.json`, the updater never copies Core's historical chain or initial migration into an existing application. It runs native `sync --no-apply` against that application's own history, then requires SQL review and the linked push confirmation. Different migration filenames do not prevent structural parity. The generated plan can also include unfinished project changes: inspect the whole migration and dry run before approving deployment. Native sync compares desired SQL with replayed history, not with production; inspect live drift separately.

A new upstream migration must be explicitly audited as structure-only and recorded by filename and SHA-256 in `schemaOnlyUpgrades` before the updater can replace it with a generated project migration. Backfills, provider records and changed bootstrap data stop the automatic update for a specific data-upgrade review. Do not classify data migrations as structure-only to bypass that stop. This version does not automate arbitrary data-upgrade recipes.

`.supacharger/database-update.json` records only unfinished update provenance and migration checksums, never the namespace. The Core lock remains unchanged until the reviewed migration is reported in the linked ledger. Resume the same target to finish. If planning failed or saved definitions/migrations changed, diagnose the failure and review the pending record; do not delete it just to bypass the check. Only discard a generated migration after confirming it was never applied and retaining any required changes. Installed migration files remain immutable.

## Maintaining the fresh-install baseline

The SQL under `src/supacharger/database-starter/` is a generated distribution artefact, not another schema source. Keep editing `supabase/schemas/`. When those definitions change, generate a new initial migration in an ignored, unlinked scratch Supabase directory containing the complete desired tree and no historical migrations. Preserve the explicit empty-install bucket records and authenticator configuration in `bootstrap.sql`; exclude historical customer backfills and runtime data. Rehearse the generated initial migration and obtain a no-change native sync for the default and custom prefixes before refreshing the template and SHA-256 entries in `contract.json`. A stale template causes fresh installation to fail rather than installing an older database. Never remove Core's deployed maintainer history as part of generating this distribution artefact.

## Migration history remains permanent

Declarative SQL describes structure; `supabase/migrations/` remains the ordered deployment history. Retain installed migration files, names and contents. Never delete the history, mark migrations reverted merely to make a command pass, or apply declarative CREATE statements directly to production.

Data changes, service binding registrations, bucket records, extension enablement and secrets are not ordinary schema definitions. Keep these in explicit forward migrations or their existing secure configuration workflow. Do not export queue contents, customer data or secret values into this tree. Disabling or deleting an extension's frontend does not authorise deleting its database objects or queued work.

## Verification before adoption or deployment

Use the project-pinned Supabase CLI. Export an existing database to an ignored staging directory first; inspect its completeness and compare against migration replay. Establish a successful no-change baseline before adoption. A successful export alone is not adoption.

The pg-delta workflow uses `supabase db schema declarative sync --no-apply -f <change_name>` to generate a migration from desired state versus migration history. Review the generated SQL, rehearse locally, then deploy the reviewed migration. It does not detect edits made directly to production. Verify live drift separately before deployment.

Historical aliases in `.supacharger/migration-aliases.json` are Supacharger metadata; the raw Supabase CLI does not interpret them. Resolve deployment selection against the actual remote ledger, without replaying equivalent migrations under another timestamp. A local historical replay failure must be diagnosed rather than bypassed with a blanket production push.

Keep grants, RLS, function security/search paths, triggers, indexes, comments and extension configuration in the review. No RPC or Bruno change is needed when adoption preserves the exact database contract; changes discovered during comparison require the usual caller and API documentation review.

## Source-first development and cloud changes

For agent-led, manual and CLI-assisted development, edit `supabase/schemas/` first, generate a forward migration with the pinned native planner, review and rehearse it, then deploy. Use Supabase Studio/Dashboard primarily to inspect structure, policies, logs and results. Direct structural edits are supported as an exceptional recovery workflow, not the normal development route. An agent executing ad-hoc SQL against production has the same reconciliation obligations as a human using the console. Dashboard-only settings such as Auth providers and secrets still use their documented configuration workflow.

When a cloud database has been changed outside source control, the task is incomplete until **both migration history and declarative source represent those changes**:

1. Verify the linked project reference, `PROJECT_NAMESPACE`, Git checkpoint, local migration files and remote ledger. Preserve uncommitted work. Identify all affected Core, extension and product schemas using their actual deployed names. Resolve pending local migrations and unrelated drift before capturing a cloud diff; do not let a pull turn unapplied local work into apparent removals. Core contract approval still applies to changes discovered in the cloud.
2. Use the pinned CLI's migration-mode `db pull <descriptive-name> --linked` to capture the remote structural difference as a new forward migration. Specify the complete affected schema selection when needed. Review generated SQL before accepting any prompt that records it as already applied remotely; do not pass `--yes`. Confirm that the database already contains exactly those changes. Do not push that same SQL to the same database again, invent historical equivalence or alter older ledger entries merely to suppress an error.
3. Export the live declarative definitions into a separate ignored staging Supabase work directory with `db pull --declarative --project-ref <verified-ref> --workdir <staging-directory>`. Prepare its `supabase/config.toml` from the project's configuration first. This command replaces the selected declarative tree; never aim an unreviewed export at the combined working tree. Include the relevant namespaced schemas and review application-owned Auth triggers and Storage policies without importing Supabase-owned table definitions.
4. Review and merge the staged definitions into their existing Core, extension and product files. Keep extension definitions under their established extension directories, declare each object once and preserve local additions. Pulling preserves deployed names such as `sc_wake_app`; it does not render `sc_app` into another namespace or change PROJECT_NAMESPACE. Reconcile any extension ownership metadata through its documented update process rather than pretending a cloud edit was an extension release.
5. Rebuild a disposable local database from the complete migration history, check that native `sync --no-apply` reports no unexplained structural differences, verify affected permissions/callers/types and compare the remote ledger. Commit the captured migration and reconciled declarations together. Check production drift separately; native sync alone compares local history with desired source.

`db pull --declarative` alone creates no migration and updates no migration ledger. A normal `db pull` alone does not refresh the desired tree. Row edits, backfills, bucket records, provider registrations and secrets are not captured as ordinary schema changes: handle any required reproducible data operation explicitly without exporting customer data or secrets. Never flatten existing history to absorb a dashboard change.

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
