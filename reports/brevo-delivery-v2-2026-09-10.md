# Brevo reliable delivery v2

## Result

Canonical extension bundle 2.0.1 supplies generic persistence, immediate pg_net dispatch, a secret-authenticated Edge worker and minute Supabase retry recovery. Applications pass authorised props through the Edge helper or transactional SQL enqueue function. Wakekeeper retains its archive authorisation and bulk privacy resolver only. No Core runtime flag, Vercel scheduler, token gateway or marketing automation was added.

The 2.0.1 packaging patch stores optional Deno modules/tests as .ts.txt templates, avoiding compilation by Core's Next.js TypeScript configuration. Installed module bytes and the 2.0.0 SQL/API contract are unchanged. The test runner stages the actual installed layout and type-checks/tests it with Deno. Existing migration bytes and released versions remain immutable.

## Ownership and rollout

- Core: extensions/brevo-email and tools/supacharger-extensions are canonical. Manifest v2 adds only namespaced worker and forward-migration targets, preserving existing overwrite/checksum/path safety and Core locks.
- Private distribution: supacharger-ext-brevo mirrors the manifest/payload and produces a local 2.0.1 archive. No push/publication or token implementation.
- CLI: canonical installer copied byte-identically into commands/extensions; migration rewrite and timestamp collision tests included.
- Wakekeeper: extension installed locally; new product migration transfers historical IDs, successes, attempts and leases, then disables the legacy claimer. Old worker is a source tombstone. App preflight and Vercel scheduling removed. Current account email/host privacy are resolved once per distinct record per batch and rechecked on retry.
- SnapScreen and Specdrive: deliberately deferred; no installation, migration, runtime or configuration changes.
- Documentation: README, Docusaurus, MCP extension guidance and separate Wakekeeper Bruno contracts updated.

## Verification

- Canonical installer and transport tests: 11 passed.
- CLI complete suite: 61 passed (working tree includes unrelated pre-existing image changes, excluded from this task's commit).
- Installed-runtime Deno tests: 4 passed; Edge entrypoint type check passed.
- Isolated PostgreSQL extension contract: permissions, input validation, replay deduplication, disjoint leases, acknowledgement/backoff, success exclusion and immediate 45-recipient dispatch split 20/20/5 passed.
- Wakekeeper migration history and new adoption migration replayed in a disposable network-isolated Supabase PostgreSQL container; platform auth/storage schema-only fixtures used, no customer data copied.
- Wakekeeper archive SQL: 44 passed; refreshed privacy SQL: 9 passed; source tests: 4 passed. Core/Wakekeeper TypeScript and shared Bruno parity passed.
- Populated-legacy-ledger upgrade check passed: notification IDs, sent markers, attempts, backoff and active lease tokens survived transfer; neither sent nor backoff/leased work was reclaimed.
- Docusaurus production build passed. Extension-specific MCP tests passed; the full MCP suite retains one pre-existing image-guidance search failure, unrelated to this change.
- Private bundle verification and real installer integration passed; archive created locally.

## Operational limits and deployment

The v2 work is source-only, not deployed. Existing v1 hosted functions/migrations are unchanged by this turn. No real emails, Git pushes or Vercel changes were performed.

Initial notifications dispatch immediately after commit, all batches of an enqueue call without waiting for cron. Recovery processes up to 20 due notifications per minute, with five-minute leases and backoff capped at one hour. Provider acceptance is not inbox delivery; Brevo's finite idempotency window cannot eliminate duplicates across long acknowledgement outages. Pending rows have no automatic expiry or permanent-error cutoff; operations must monitor and choose retention policies.

Before production cutover, pause the old worker and wait for in-flight work to finish, apply both new migrations, deploy the extension worker/old tombstone, configure Edge credentials/template IDs and verify. Only then configure Vault's URL and matching worker secret to enable dispatch. Reuse Wakekeeper's existing key name with BREVO_API_KEY_ENV=BREVO_APIKEY. The app-source preflight removal still needs a future application release, which was not performed here.
