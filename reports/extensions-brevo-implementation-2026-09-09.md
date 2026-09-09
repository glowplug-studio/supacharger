# Extensions and Brevo implementation — 9 September 2026

**Subsequent update:** the owner approved the template-8 follow-up. Wakekeeper migration `20260909170000_add_cancellation_email_host_projection.sql`, template mapping and privacy/batch tests are implemented locally. See `../../wakekeeper-spacharger-app/reports/brevo-template-8-migration-2026-09-09.md`. Approval-pending statements below describe the earlier checkpoint; hosted deployment remains outstanding.

## Status

Core's local extension system and reusable Brevo module are implemented. Wakekeeper has the module installed and its existing cancellation outbox wired to a service-authenticated Edge worker. CLI, README, Docusaurus, repository MCP and agent guidance are updated. No deployment, migration application, real email, npm publication, token gateway or commercial sales flow was performed.

**Not complete for the owner's subsequently supplied template.** Brevo template `8` requires `flotilla_title` and `flotilla_host`. The current product RPC lacks host data and the worker still uses its original `flotilla_name`/`archived_at` mapping. Approval has been requested for the additional Wakekeeper-only forward migration and matching adapter/Bruno/tests. Do not configure template 8 or enable delivery until that follow-up lands.

## What changed

- Canonical `extensions/brevo-email/`: immutable manifest, hashed transport payload and installed integration guide.
- Canonical `tools/supacharger-extensions/`: local installer and doctor, also shipped byte-identically in the separate CLI repository. The local CLI now exposes `extension install <id> --source <bundle> [--plan]` and `extension doctor <id>`.
- Destination namespaces separate extension-managed source from Core and product adapters. Traversal, symlinks, protected paths, checksum failures, local edits, same-version changes and unsafe removals stop installation. Recovery material is outside compilable source. Reinstallation is idempotent; the actual Wakekeeper install was upgraded from local 1.0.0 to 1.0.1 to validate the corrected UUID-based provider contract.
- Removed the old executable/submodule installer and enable/disable/uninstall stubs. Removed the inert newsletter registry and checkbox from Core and Wakekeeper. These tracked files remain recoverable from Git history. No other consumer was modified.
- Wakekeeper's cron route now forwards to its own Edge worker. The module only sends authorised Brevo template data; it has no flotilla queries, product names, public endpoint, branding or template IDs. Product mappings remain outside it.
- The historical unrestricted `brevo_send_tx_email` source is a 410 tombstone. Redeploying it remains necessary to retire a hosted copy.
- MCP exposes `extensions` guidance and distinguishes canonical bundles, installed extension source and product adapters. Agent files point to installed guides. Restored Core/docs agent references now point to the actual sibling repositories.

## Scope and ownership

The approved implementation is under the Supacharger Core gate: canonical catalogue/tooling, legacy managed form cleanup and Core documentation; Wakekeeper receives the same form cleanup plus the optional installed extension. Its cron/action/worker/configuration/tests remain product-owned. The existing queue migration, RPC arguments and lease semantics were preserved. No shared database/API migration was required. Core and Wakekeeper ownership manifests and Wakekeeper's Core lock were not advanced or rewritten for this partial rollout.

SnapScreen and Specdrive retain their previous newsletter stubs and are intentionally deferred. A future full Core update must account for this partial managed-file change rather than treating the existing lock as proof of whole-repository alignment. Shared Bruno RPCs are unchanged; the separate Wakekeeper Bruno repository documents the new worker and retired relay.

V1 is a reviewed local source installer, not a universal unattended plugin orchestrator. It does not install dependencies, mutate application configuration, generate product wiring, apply migrations, deploy functions or automate uninstall. Those steps are documented for an agent/human to integrate. No runtime registry is introduced, so uninstalled extensions add no application imports or network checks. Hashes are integrity checks, not publisher authentication; signed/token downloads remain future work.

## Template 8: pending project-contract change

Inspected the current `api.get_flotillas` host projection: name and username are visible only for a public profile or to the host themself. Preserve that rule per email recipient even though the worker has service privileges. Use an anonymous host label for other recipients when the host is private. Send each notification to the recipient's current `auth.users.email`, never a vessel contact address.

Proposed new forward migration extends `api.claim_flotilla_cancellation_emails` with privacy-filtered host data and recipient display names. Resolve distinct flotilla/host records once per batch; bulk-fetch recipient accounts/profiles and match in SQL. Preserve the queued title snapshot and existing deduplication/lease/acknowledgement rules. This avoids per-recipient profile queries and does not require two HTTP database round-trips.

Affected: a new Wakekeeper migration, its Edge adapter/schema, SQL/runtime tests, claim RPC Bruno documentation and setup guide. JSON output additions must land with the strict worker parser. Existing rows remain intact; historical migrations are not rewritten. **Supacharger Core is unaffected by this additional product contract; no other consumer requires synchronisation.** Awaiting explicit approval for this new change set.

The worker currently claims at most 20 notifications per invocation, sends each separately in parallel and acknowledges each lease. The minute cron therefore handles up to 20 per invocation. Separate sends preserve recipient privacy and stable per-job idempotency. Larger-volume throughput needs deliberate scheduler/concurrency tuning; do not advertise unlimited throughput.

## Verification

- Core extension/installer tests: 9 passed.
- Separate CLI full suite including extension tests: 59 passed; legacy install fails safely with migration guidance.
- Wakekeeper mocked cancellation tests: 7 passed, including service authentication, strict envelope/size validation, configuration-before-claim, lease acknowledgement, provider failures, mixed invalid rows and cron authentication.
- Core authentication journey: 56 passed after removing the unused checkbox.
- Core and Wakekeeper TypeScript checks passed; the new Edge entry point passed Deno checking.
- Focused lint passed after sorting the new server adapter imports.
- Installed extension doctor passed; canonical/CLI installer copies match.
- Shared Bruno parity passed: 14 canonical RPCs in Core and Wakekeeper.
- Docusaurus production build passed, including private-output verification.
- MCP: 14 of 15 passed, including extension guidance and stdio resource registration. The existing image-guidance search expects obsolete text removed by unrelated image work; not modified here.
- Wakekeeper's broader flotilla source-contract suite: 31 of 38 passed. Seven unrelated presentation assertions fail against existing UI changes; this task did not edit those components or assertions.

Tests are mocked/static/type checks, not proof of hosted deployment, database migration state, a valid Brevo key, active template or inbox delivery. Existing dirty image/auth/UI work was preserved. No database tests were run for a host migration because that migration has not been authorised or written.

## Deployment prerequisites

After the template follow-up lands, configure template 8 and `BREVO_API_KEY` in Supabase, a dedicated random worker secret in both runtimes, and the Vercel cron secret. Deploy the approved database/Edge/application changes, retire the old hosted relay, then explicitly authorise a test notification. See Wakekeeper's `docs/flotilla-cancellation-email.md` for the exact checklist. Keep credentials out of source, command arguments, logs and chat.

Provider references: [Brevo transactional API](https://developers.brevo.com/reference/send-transac-email), [Brevo UUID idempotency and 30-minute window](https://developers.brevo.com/docs/heterogenous-versions-batch-emails), [Supabase Edge authentication](https://supabase.com/docs/guides/functions/auth). Provider acceptance is not delivery, and prolonged acknowledgement outages can still cause duplicates after the deduplication window.
