# Declarative database adoption: supacharger

Created: 2026-10-30T15:39:02+07:00 (Asia/Bangkok)
Last edited: 2026-10-30T15:44:25+07:00 (Asia/Bangkok)

## Source and verification

The complete desired-state tree is in `supabase/schemas/`: 106 SQL files, byte-for-byte identical to the production export taken during this task (directory moves excluded). Historical migrations are unchanged. No production database write, new migration, data migration, bucket change, secret change, Edge deployment or RPC contract change was needed.

All three applications were reconstructed in disposable local PostgreSQL environments and compared without database differences. Core and Specdrive returned zero planned actions; Wakekeeper target/shadow comparison returned no differences. Custom roles were supplied in the Specdrive rehearsal and aligned between the isolated servers. No customer rows, queue contents or Vault credentials were copied. TypeScript passes in all three applications. Docusaurus build and MCP checks pass. There are no caller-visible API changes requiring Bruno modifications.

The desired tree is developer-owned in consumers. Core's namespace renderer and read-only planning command are exact managed files. The Node engine is pinned to pg-delta 1.0.0-alpha.60 and pg-topo 1.0.0-alpha.8; project Supabase CLI is pinned to 2.122.0. PROJECT_NAMESPACE remains the only namespace source. Core uses empty, Wakekeeper wake and Specdrive spec.

## Operational limitations

Native declarative sync stalled with both system CLI 2.116.0 and project CLI 2.122.0. Source inspection shows a single-connection pool on the native declarative route; the Node engine completed the same comparison. The supported fallback is `npm run db:schema:plan`, against an explicitly selected disposable local database. It refuses remote targets and writes an ignored SQL plan without applying it. This compares local state, not migration history. Read `docs/agents/declarative-database.md` before use.

Historical replay differs from deployed state: Core's public default permissions and platform-installed automatic RLS trigger needed aligning in the disposable rehearsal only (16 planned actions, no sc_ object differences). Wakekeeper native replay fails on an existing Storage policy comment ownership restriction; raw db push also rejects three already-verified historical timestamp aliases. No historical file or remote ledger was changed to hide these differences. Specdrive requires its existing specdrive_mcp and supacharger_agent roles. Wakekeeper Cron needs a separate shadow server with the matching cron database name. These constraints remain explicit; native sync is not certified as working.

Extension definitions: transactional-email has 16 files and invitations 31, all rendered files matching Wakekeeper's production export. Brevo's current marketing foundation has no active SQL payload; historical Brevo SQL was not reintroduced. Service bindings, enablement, bucket records and secrets retain their explicit migration/configuration lifecycle.

Existing CLI checks: 69 pass, two historical Core-lock fixture failures. Existing Core installer checks: two pass, five stale expectations for removed hash/healthy/recovery behaviour; those expectations already conflict with HEAD. No tests were added or changed. Focused namespace rendering, repeated starter rendering, manifest validation and extension comparisons pass.

## Publication

Implementation commit `2fa4f0a` is pushed and Vercel production deployment `dpl_44xbGiFV3N37JY8n1tyuPu9b5qRd` is READY. Public application landing checks returned HTTP 200 for all three applications. Docusaurus commit fe7ea86 is deployed READY as dpl_BwhXJ6uXAFmeKpM1C9qcAcdEqagn. The 230 managed Core files match both consumers. No production database migration is pending from this task; no historical migration was changed. Disposable rehearsal containers created during this task were removed.

CLI source a6e9d0f is pushed to its established development branch. Invitations source e482a54 and transactional-email source 9e877d7 include their new declarative payloads; Brevo documentation 6a31896 explains its lack of a current SQL payload. npm publication could not run: npm whoami returned ENEEDAUTH; the public CLI version remains 1.0.4. Existing consumer registry locks are preserved; no new npm or registry release is claimed. The installed projects already contain their pinned Node planning tools. Native Supabase sync remains subject to the limitations above.

This evidence records the deployed implementation commits; subsequent report-only commits do not change the implementation.
