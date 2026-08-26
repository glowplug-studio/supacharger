# Agent connections implementation checklist

## Repository instructions and discovery

- [x] Read workspace, Core, CLI, documentation and consumer instructions.
- [x] Inspect Specdrive's OAuth/MCP implementation and the managed account/organisation seams.
- [x] Inspect current Supabase OAuth server and custom access-token hook documentation.
- [x] Record unrelated Wakekeeper database changes to preserve.

## Scope

- Outcome: Core-owned, product-extensible OAuth agent connections with organisation and personal management, least-privilege tokens, managed routes and completely external presentation.
- In scope: Core, CLI, Docusaurus, SnapScreen, Wakekeeper and Specdrive; schema, Auth Hook, configuration, routes, CSS, Bruno, generated types and deployment guidance.
- Explicit non-goals: displaying raw tokens; privileged cross-user Supabase Auth grant deletion; copying licence-restricted Specdrive UI into Core.
- Protected follow-up deliverables: hosted Specdrive migration/configuration, fresh OAuth smoke, Source Explorer sample sync and browser regression.

## Decisions, assumptions, and questions

| Item | Category | Evidence or owner | Status |
| --- | --- | --- | --- |
| Generic database role is `supacharger_agent`. | decision | Human-approved Core promotion | Approved |
| Product-specific resource bindings remain product-owned. | decision | Workspace ownership policy | Approved |
| Organisation administrators revoke application access immediately; users revoke their own underlying OAuth grant. | decision | Human approval gate report | Approved |
| `AGENT_CONNECTIONS.ENABLED` gates application UI/server behaviour and a matching database extension gates connection resolution. | decision | External hosted Auth cannot be mutated by Vercel runtime config | Approved |
| Managed JSX exposes semantic hooks only; developer CSS contains the complete presentation with `@apply`. | decision | Human instruction | Approved |

## Architecture and dependency graph

- [x] Add Core migration, least-privilege role, connection ledger, resolver, dispatcher and product extension functions.
- [x] Add configuration and managed account/organisation/consent routes.
- [x] Add complete developer stylesheet and English catalogue.
- [x] Add generated types, Bruno and contract tests.
- [ ] Update CLI, repository MCP guidance and Docusaurus.
- [ ] Publish Core and propagate to consumers.
- [ ] Adapt Specdrive project bindings and independent MCP role.
- [ ] Apply hosted migrations/configuration and verify the complete flow.

## Security, permissions, and secrets

- [x] OAuth tokens use only the generic least-privilege role.
- [x] Every agent call rechecks current connection and organisation membership.
- [x] Organisation administrators see organisation connections; members see only their own.
- [x] Raw access and refresh tokens never enter application tables, UI, logs, Bruno or documentation.
- [x] Denied, revoked, disabled and stale-token paths have regression coverage at the database and contract layers.

## Documentation obligations

- [x] Core README and agent guidance.
- [ ] Docusaurus configuration, styling, OAuth and deployment pages.
- [ ] Repository knowledge MCP resources.
- [ ] Bruno and Specdrive OpenAPI.
- [ ] Consumer deployment/handoff notes.

## Verification

| Check | Exact command/action | Result | Evidence/notes |
| --- | --- | --- | --- |
| Local migration reset | `npx supabase db reset` | Pass | Full ledger and seed applied. |
| Database tests | `npm run db:test` | Pass | 44 pgTAP tests. |
| Database lint | `npm run db:lint` | Pass | No schema errors or warnings. |
| Agent contracts | `npm run test:agent-connections` | Pass | 7 tests. |
| Related UI/contracts | account summary, account settings, organisation UI | Pass | 19 tests. |
| Bruno parity | `npm run check:bruno-rpcs` | Pass | 15 Core RPCs. |
| TypeScript | `npm run typecheck` | Pass | No errors. |
| ESLint | `npm run lint` | Pass with pre-existing warnings | No errors; nine unrelated warnings remain. |
| Production build | `npm run build` | Pass | Next 16 compiled all managed routes and `@apply` CSS. |

## Deployment and human-only actions

- [ ] Record hosted OAuth Server and Auth Hook settings per environment.
- [ ] Record any hosted operation blocked by platform permissions.

## Post-feature deliverables

| Deliverable | Status | Evidence | Remaining owner/action |
| --- | --- | --- | --- |
| Specdrive Source Explorer OAuth smoke | In progress | Existing blocker handoff | Complete after generic role deployment. |
| Sample repository sync and UI inspection | In progress | Existing Night Garden fixture | Complete after OAuth smoke. |
