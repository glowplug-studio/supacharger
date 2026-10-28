# Core profile consolidation

Created: 2026-10-28T22:20:43+07:00 (Asia/Bangkok)
Last edited: 2026-10-28T23:27:56+07:00 (Asia/Bangkok)

## Authority and scope

The user approved Core and all consumers, Supabase-hosted media, breaking replacement without legacy endpoints, Docusaurus, agent guidance and MCP updates. Unrelated working changes are preserved.

## Delivered

- Atomic Core profile request with private typed product hooks and separate public projection.
- Core-managed Supabase profile-media Edge Function; no application proxy or compatibility aliases.
- Wakekeeper private extension, public member page and resource-owned vessel privacy.
- Core source and consumer locks published at 7bba1363cd999ecaaafc25db17c7ae8d4a3cec2d. Wakekeeper main includes the release; Specdrive and Snapscreen source is on codex/profile-consolidation pending hosted access.
- Docusaurus, agent guidance, repository MCP profile_extensions topic, CLI migration, shared/product Bruno and endpoint register updated.

## Verification and release

Core and consumer TypeScript checks, targeted lint, isolated restored-schema migration and transaction/ownership checks passed. MCP 16 and CLI 71 existing checks passed; Docusaurus build and four existing marketing tests passed. No new tests added. Wakekeeper app, both hosted migrations and media Edge Function are live; six retired RPCs and old URL producers verified absent. Public media returns JPEG bytes and public member page returns 200. Docs, watcher and marketing production deployments are READY.

Specdrive/Snapscreen previews passed. Hosted Supabase CLI returned 403 for function deployment/database access. Their previous production frontends were restored to avoid mismatched contracts. Source changes are ready; hosted migration/function cutover requires restored Supabase privileges. Specdrive local migration was applied successfully. No hosted writes were made to either blocked project.

CLI source e37179e is published; npm release not performed. Existing MCP server processes may need restarting to load the new topic. Source repositories retain unrelated working edits; release commits were isolated and published without resetting their files/indexes.

## Detailed evidence

Wakekeeper report: docs/reports/profile-consolidation/2026-10-28-profile-api-consolidation.md in wakekeeper-spacharger-app. It records contracts, permissions, tests, rollout IDs and register synchronisation.
