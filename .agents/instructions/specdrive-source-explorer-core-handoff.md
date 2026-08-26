# Specdrive Source Explorer — Core agent-connections handoff

Date: 26 August 2026

Branches: `codex/SPECD-68-sauce-explorer-nightly`

## Canonical result

Supacharger Core now owns generic OAuth agent consent, the revocable
organisation/user/client ledger, the isolated `supacharger_agent` database role,
account and organisation Agents settings, and the external presentation hooks.
Specdrive owns Source Explorer, its `mcp_api` operations, and the transactional
extension binding a Core connection to one project.

This replaces the earlier proposal for a Specdrive-only Auth-hook wrapper. New
OAuth tokens use `supacharger_agent`; previously issued `specdrive_mcp` tokens
retain bounded compatibility only through Specdrive's project resolver while
users reauthorise.

## Core filesystem map

```text
supabase/migrations/20260826050719_add_agent_connections.sql
  generic role, ledger, API dispatcher, custom-token hook branch, feature gate
src/supacharger/agents/
  managed connection contract, services, consent and settings UI
src/app/(supacharger)/auth/oauth/consent/
  managed Supabase OAuth consent callback surface
src/app/(supacharger)/(authenticated)/account/agents/
  current user's connection management
src/app/(supacharger)/(authenticated)/[handle]/settings/agents/
  organisation-level management with owner/admin visibility
src/supacharger.adapters/agents/
  preserved product extension inputs and connection summary
src/styles/supacharger-agents.css
  preserved developer-owned complete `sc-agent-*` presentation via `@apply`
src/supacharger.config.ts
  developer-owned `AGENT_CONNECTIONS.ENABLED` choice
docs/agents/agent-connections.md
  canonical agent-facing contract and source inventory
docs/api/supabase-rpc.openapi.yaml
docs/bruno/supacharger-rpc/agent_connections.bru
  public human-management API contract
```

## Consumer synchronisation

- Supacharger CLI distributes the managed files, migration, tests and Bruno
  request while preserving config, adapters and agent CSS.
- Supacharger docs describes configuration, styling, hosted OAuth/Auth Hook
  setup, role claims and deployment verification.
- SnapScreen and Wakekeeper carry adapted migration aliases and the exact
  managed contract; their product setting remains disabled.
- Specdrive enables the flag, adapts the migration to its existing organisation
  and project schema, grants only its explicit `mcp_api` functions, and maps the
  connection extension to `app.project_mcp_authorisations`.

## Compatibility and deployment risks

- The application flag, database feature-gate override, hosted OAuth Server,
  and hosted Custom Access Token Hook selection must agree. Repository config
  cannot change the hosted Auth switches.
- Revocation blocks the application boundary immediately. Own-user revocation
  also revokes the Supabase OAuth grant; organisation administrators do not gain
  cross-user Auth administration.
- Raw access and refresh tokens never enter the application table, UI, docs,
  Bruno collection, or logs.
- Core migrations are forward-only. Consumers adapt through an audited
  `.supacharger/migration-aliases.json`; no applied history is rewritten.
- Source Explorer remains product-owned and stores source snapshots in Postgres,
  not Supabase Storage. It is not promoted into Core by this change.

## Verification and remaining handoff

Core local reset, pgTAP, database lint, contracts, Bruno parity, TypeScript,
lint and build passed. SnapScreen and Wakekeeper local resets and managed
contracts passed. The canonical Core migration and the adapted SnapScreen,
Wakekeeper and Specdrive migrations are hosted; the consumers keep their
feature disabled or enabled according to their committed configuration.
Specdrive's ready Vercel branch artefact was promoted to production.

Chrome verification confirms that Specdrive's hosted OAuth Server, dynamic
OAuth clients and `app.custom_access_token_hook` are enabled with the correct
Site URL and consent path. The only remaining handoff is human: Chrome's
1Password extension must be unlocked before the final signed-in page matrix and
Night Garden MCP upload can run. That exact resume sequence is recorded in
`specdrive-main/.agents/instructions/source-explorer-blocker-handoff.md`; do not
replace it with an authentication workaround.
