# Core namespace deployment handoff

Created: 2026-10-30T03:30:54+07:00 (Asia/Bangkok)
Last edited: 2026-10-30T05:19:19+07:00 (Asia/Bangkok)

## Current status: namespace database cutover applied

The authorised cutover applied atomic profile extensions, Core service bindings and `20261029211044_core_namespace_cutover.sql` to Supacharger Demo (`lubojzqjhvjoextyhfqn`). A further forward migration, `20261029221755_align_authenticator_namespace_setting.sql`, corrected the authenticator role override that still named legacy API schemas and caused a PostgREST cache error. After configuration/schema reload, the public catalogue RPC returns HTTP 200.

The existing disposable local PostgreSQL rehearsal contains the migrated schemas and service/profile contracts. The authenticator correction also passed locally. TypeScript passes. All 23 original production tables retain their OIDs, owners, ACLs and RLS flags. Historical migration files were not rewritten. Hosted configuration now exposes graphql_public/sc_api/sc_api_edge, retains extensions as the extra search path, and selects sc_app.custom_access_token_hook. Existing production/redirect URLs, email settings and disabled vector Storage were preserved. The canonical local config was restored after the hosted projection.

Created private sc_user-avatars and sc_organisation-logos buckets through the Storage API, preserving source bucket settings. Both original buckets were empty; no objects required copying. Existing buckets and workers remain for recovery. Both sc_process_image_upload and sc_profile-media deployed successfully. SC_IMAGE_UPLOAD_SIGNING_SECRET was set from the ignored local environment and digest-verified; the matching Vercel production/preview variable is sensitive. No secret values are recorded here. The private profile-media origin is configured for production.

Core application/configuration commit 5c3c297 was pushed from the canonical checkout; its Vercel deployment is being verified. Existing staged changes in docs/agents/agent-guidance.md, core-services.md and project.md belong to other work and remain excluded from this task's commits. The changelog skill was used for the required commit review. Existing Docusaurus namespace instructions already describe coordinated cutover; no new developer-facing contract was introduced by this deployment correction.

Specdrive and Wakekeeper managed files are being synchronised to this Core snapshot while their locks retain the registry baseline 0.0.1-alpha / c57960d53d5ea82ed1b3e08aa1cd091bfd404b33, as explicitly authorised. This is working-source parity, not release-source equality. Declarative definitions are not adopted here. Wakekeeper's unapplied legacy navigation draft requires an explicit disposition before claiming an entirely reconciled baseline. Authenticated browser flows were not exercised.

## Historical preparation snapshot

The following text records the earlier incomplete handoff and is superseded by the current status above.

## Status: incomplete database preparation — do not deploy yet

The namespace runtime implementation is committed in 65800d8. It does not establish that the Core database has been migrated. This follow-up corrects supabase/config.toml to expose sc_api/sc_api_edge, select the sc_app Auth hook, and deploy sc_process_image_upload/sc_profile-media using the existing canonical source folders. TOML parses and both entrypoints exist. These settings require the corresponding database cutover; do not restart or deploy against an unmigrated database as though setup were complete.

PROJECT_NAMESPACE is an empty string, resolving to sc_. Only that developer-owned configuration property selects the prefix. Existing application calls use the resolver. Logical type keys such as api and calls such as schemaName('api') intentionally retain unprefixed logical names.

## Required work in the Core deployment chat

Inspect the live Core catalogue and migration ledger using an authorised connection. Capture function definitions, owners, permissions, search paths, policies, constraints, Auth hooks, Storage inventory, custom secrets and scheduled jobs before preparing a forward migration. Do not assume the Wakekeeper catalogue matches Core.

Create and review a data-preserving forward migration for the existing Core schemas and textual references. Preserve historical migration files byte-for-byte. Rename app/api/api_edge/internal/sc_services to sc_app/sc_api/sc_api_edge/sc_internal/sc_services where applicable; sc_services is already the correct default name and must not be renamed to itself. Inspect any additional application schemas individually.

Prepare namespaced Storage resources through the Storage API, verify object contents, and update policies and stored references. Coordinate namespaced Edge functions, SC_IMAGE_UPLOAD_SIGNING_SECRET, hosted Data API exposure and the Auth hook with the application deployment. Verify database and application behaviour before retiring old resources.

First-install SQL preparation still needs completion: replaying only the present historical migrations creates legacy names. The forward migration or a separately verified first-install preparation path must close that gap before advertising this checkout as install-ready. Do not globally replace identifiers in installed migration history.

No Core database migration was created or applied in this follow-up. No Core deployment was performed. Declarative adoption is a later step after the required production cutovers. The current deployment handoff explicitly records unfinished prerequisites rather than claiming readiness.
