# Organisation routing alignment — 26 October 2026

## Result and scope

- Standalone chooser: `/organisation/choose`, outside account settings layouts.
- Managed settings: `/organisation/[org-handle]/settings`, including team, billing and adapter sections.
- `/organisation` returns HTTP 301 before authentication routing and retains safe query parameters. Former chooser and root-handle settings files are removed without redirects.
- Core configuration, invitations, handle-change navigation, cache revalidation, billing portal actions and returns are aligned in all three consumers.
- Specdrive retains its licensed chooser, application chrome, usage/agent-licence adapters and product routes under its separate `[handle]` directory. No restricted UI source was copied into Core.
- CLI migration updates existing canonical route values as well as missing defaults. Its existing managed-file removal handles obsolete route files. Developer-owned links require deliberate updates, documented in Docusaurus.
- Docusaurus has a Core Routes & Sitemap page using the existing anatomy tree, with filtering and path copying.

## Verification

- All four application TypeScript checks passed after regenerating Next.js route types.
- Docusaurus type check and local build passed; browser inspection confirmed layout, filtering and copy feedback.
- CLI: 71 existing tests passed. A temporary manual migration check confirmed read-only preview, exact value conversion and idempotence.
- Core authentication: 23 existing tests passed. Repository MCP: 16 existing tests passed.
- Changed managed files were SHA-256 compared with Core in every consumer; all matched. Consumer Core locks remain at their published baseline rather than an unpublished local commit.
- Live Core HTTP check confirmed 301 and query preservation.
- Focused lint checks: existing image and unused-import warnings only after sorting the chooser imports.
- Application production builds and authenticated browser journeys were not run. Wakekeeper UI checks were excluded by its project instructions; Specdrive build-heavy verification was excluded by its project instructions. No database migration was needed or applied.

## Bruno review

Reviewed the canonical `docs/bruno/supacharger-rpc/organisations.bru`, billing overview/access requests, Specdrive's product organisation requests, and Wakekeeper's separately versioned `Wakekeeper/collections/Supabase/organisations.yml` plus its Supabase synchronisation notes. RPC paths, methods, schema headers, bodies, authentication, responses and database behaviour are unchanged. The moved application billing-portal POST is not represented in these collections. No matching Bruno request requires a path update; SnapScreen and Wakekeeper's canonical requests remain identical to Core.

## Remaining local state

The unrelated Core sidebar-demo edit is excluded. No publication, deployment or Core-lock advancement is part of this task. Specdrive source synchronisation is disabled for both configured services; the repository-local synchronisation tool is unavailable in this session.

## Changed files

Paths below are relative to each repository. Deleted and newly added route files represent the route moves.

### supacharger

- `CHANGELOG.md`
- `README.md`
- `docs/agents/authentication-and-claims.md`
- `docs/agents/organisation-settings.md`
- `src/app/(supacharger)/(authenticated)/[handle]/settings/[section]/page.tsx`
- `src/app/(supacharger)/(authenticated)/[handle]/settings/billing/page.tsx`
- `src/app/(supacharger)/(authenticated)/[handle]/settings/billing/portal/route.ts`
- `src/app/(supacharger)/(authenticated)/[handle]/settings/layout.tsx`
- `src/app/(supacharger)/(authenticated)/[handle]/settings/page.tsx`
- `src/app/(supacharger)/(authenticated)/[handle]/settings/team/[teamTab]/page.tsx`
- `src/app/(supacharger)/(authenticated)/[handle]/settings/team/page.tsx`
- `src/app/(supacharger)/(authenticated)/account/organisation/page.tsx`
- `src/app/(supacharger)/(authenticated)/organisation/[org-handle]/settings/[section]/page.tsx`
- `src/app/(supacharger)/(authenticated)/organisation/[org-handle]/settings/billing/page.tsx`
- `src/app/(supacharger)/(authenticated)/organisation/[org-handle]/settings/billing/portal/route.ts`
- `src/app/(supacharger)/(authenticated)/organisation/[org-handle]/settings/layout.tsx`
- `src/app/(supacharger)/(authenticated)/organisation/[org-handle]/settings/page.tsx`
- `src/app/(supacharger)/(authenticated)/organisation/[org-handle]/settings/team/[teamTab]/page.tsx`
- `src/app/(supacharger)/(authenticated)/organisation/[org-handle]/settings/team/page.tsx`
- `src/app/(supacharger)/(authenticated)/organisation/choose/page.tsx`
- `src/app/(supacharger)/api/organisations/route.ts`
- `src/proxy.ts`
- `src/styles/supacharger-organisations.css`
- `src/supacharger.config.ts`
- `src/supacharger/auth/sensitive-auth-query.ts`
- `src/supacharger/organisations/organisation-billing-page.tsx`
- `src/supacharger/organisations/organisation-profile-form.tsx`
- `src/supacharger/organisations/organisation-routes.ts`
- `src/supacharger/organisations/organisation-team.tsx`
- `src/supacharger/supacharger-config-contract.ts`
- `tools/supacharger-mcp/README.md`
- `tools/supacharger-mcp/src/project.js`
- `tools/supacharger-mcp/test/project.test.js`

### specdrive-supacharger-app

- `CHANGELOG.md`
- `README.md`
- `docs/agents/organisation-settings.md`
- `src/app/(project)/(authenticated)/[handle]/clients/[clientCode]/edit/page.tsx`
- `src/app/(project)/(authenticated)/[handle]/clients/page.tsx`
- `src/app/(project)/(authenticated)/[handle]/organisation-settings/use-organisation-profile.ts`
- `src/app/(project)/(authenticated)/[handle]/page.tsx`
- `src/app/(project)/(authenticated)/[handle]/projects/new/page.tsx`
- `src/app/(project)/(authenticated)/[handle]/projects/projects-grid.tsx`
- `src/app/(project)/(authenticated)/[handle]/upgrade/upgrade-split-image-quote.tsx`
- `src/app/(project)/(authenticated)/account/api.ts`
- `src/app/(project)/(authenticated)/organisation/organisation-access-panels.tsx`
- `src/app/(project)/(authenticated)/organisation/page.tsx`
- `src/app/(supacharger)/(authenticated)/[handle]/settings/[section]/page.tsx`
- `src/app/(supacharger)/(authenticated)/[handle]/settings/billing/page.tsx`
- `src/app/(supacharger)/(authenticated)/[handle]/settings/billing/portal/route.ts`
- `src/app/(supacharger)/(authenticated)/[handle]/settings/layout.tsx`
- `src/app/(supacharger)/(authenticated)/[handle]/settings/page.tsx`
- `src/app/(supacharger)/(authenticated)/[handle]/settings/team/[teamTab]/page.tsx`
- `src/app/(supacharger)/(authenticated)/[handle]/settings/team/page.tsx`
- `src/app/(supacharger)/(authenticated)/account/organisation/page.tsx`
- `src/app/(supacharger)/(authenticated)/organisation/[org-handle]/settings/[section]/page.tsx`
- `src/app/(supacharger)/(authenticated)/organisation/[org-handle]/settings/billing/page.tsx`
- `src/app/(supacharger)/(authenticated)/organisation/[org-handle]/settings/billing/portal/route.ts`
- `src/app/(supacharger)/(authenticated)/organisation/[org-handle]/settings/layout.tsx`
- `src/app/(supacharger)/(authenticated)/organisation/[org-handle]/settings/page.tsx`
- `src/app/(supacharger)/(authenticated)/organisation/[org-handle]/settings/team/[teamTab]/page.tsx`
- `src/app/(supacharger)/(authenticated)/organisation/[org-handle]/settings/team/page.tsx`
- `src/app/(supacharger)/(authenticated)/organisation/choose/page.tsx`
- `src/app/(supacharger)/api/organisations/route.ts`
- `src/components/application-error/application-error-content.tsx`
- `src/components/application/account-menu.tsx`
- `src/components/application/app-shell.tsx`
- `src/components/application/organisation-header-avatar.tsx`
- `src/components/application/overview-tabs.tsx`
- `src/components/auth/email-verified-toast.tsx`
- `src/components/login-form.tsx`
- `src/components/shared-assets/not-found/not-found-simple-05.tsx`
- `src/components/sign-up-form.tsx`
- `src/components/update-password-form.tsx`
- `src/lib/app-routes.ts`
- `src/lib/auth/active-organisation.ts`
- `src/proxy.ts`
- `src/supacharger.config.ts`
- `src/supacharger/auth/sensitive-auth-query.ts`
- `src/supacharger/organisations/organisation-billing-page.tsx`
- `src/supacharger/organisations/organisation-profile-form.tsx`
- `src/supacharger/organisations/organisation-routes.ts`
- `src/supacharger/organisations/organisation-team.tsx`
- `src/supacharger/supacharger-config-contract.ts`

### snapscreen-supacharger-app

- `CHANGELOG.md`
- `README.md`
- `docs/agents/authentication-and-claims.md`
- `docs/agents/organisation-settings.md`
- `src/app/(supacharger)/(authenticated)/[handle]/settings/[section]/page.tsx`
- `src/app/(supacharger)/(authenticated)/[handle]/settings/billing/page.tsx`
- `src/app/(supacharger)/(authenticated)/[handle]/settings/billing/portal/route.ts`
- `src/app/(supacharger)/(authenticated)/[handle]/settings/layout.tsx`
- `src/app/(supacharger)/(authenticated)/[handle]/settings/page.tsx`
- `src/app/(supacharger)/(authenticated)/[handle]/settings/team/[teamTab]/page.tsx`
- `src/app/(supacharger)/(authenticated)/[handle]/settings/team/page.tsx`
- `src/app/(supacharger)/(authenticated)/account/organisation/page.tsx`
- `src/app/(supacharger)/(authenticated)/organisation/[org-handle]/settings/[section]/page.tsx`
- `src/app/(supacharger)/(authenticated)/organisation/[org-handle]/settings/billing/page.tsx`
- `src/app/(supacharger)/(authenticated)/organisation/[org-handle]/settings/billing/portal/route.ts`
- `src/app/(supacharger)/(authenticated)/organisation/[org-handle]/settings/layout.tsx`
- `src/app/(supacharger)/(authenticated)/organisation/[org-handle]/settings/page.tsx`
- `src/app/(supacharger)/(authenticated)/organisation/[org-handle]/settings/team/[teamTab]/page.tsx`
- `src/app/(supacharger)/(authenticated)/organisation/[org-handle]/settings/team/page.tsx`
- `src/app/(supacharger)/(authenticated)/organisation/choose/page.tsx`
- `src/app/(supacharger)/api/organisations/route.ts`
- `src/proxy.ts`
- `src/styles/supacharger-organisations.css`
- `src/supacharger.config.ts`
- `src/supacharger/auth/sensitive-auth-query.ts`
- `src/supacharger/organisations/organisation-billing-page.tsx`
- `src/supacharger/organisations/organisation-profile-form.tsx`
- `src/supacharger/organisations/organisation-routes.ts`
- `src/supacharger/organisations/organisation-team.tsx`
- `src/supacharger/supacharger-config-contract.ts`

### wakekeeper-spacharger-app

- `CHANGELOG.md`
- `README.md`
- `docs/agents/authentication-and-claims.md`
- `docs/agents/organisation-settings.md`
- `src/app/(supacharger)/(authenticated)/[handle]/settings/[section]/page.tsx`
- `src/app/(supacharger)/(authenticated)/[handle]/settings/billing/page.tsx`
- `src/app/(supacharger)/(authenticated)/[handle]/settings/billing/portal/route.ts`
- `src/app/(supacharger)/(authenticated)/[handle]/settings/layout.tsx`
- `src/app/(supacharger)/(authenticated)/[handle]/settings/page.tsx`
- `src/app/(supacharger)/(authenticated)/[handle]/settings/team/[teamTab]/page.tsx`
- `src/app/(supacharger)/(authenticated)/[handle]/settings/team/page.tsx`
- `src/app/(supacharger)/(authenticated)/account/organisation/page.tsx`
- `src/app/(supacharger)/(authenticated)/organisation/[org-handle]/settings/[section]/page.tsx`
- `src/app/(supacharger)/(authenticated)/organisation/[org-handle]/settings/billing/page.tsx`
- `src/app/(supacharger)/(authenticated)/organisation/[org-handle]/settings/billing/portal/route.ts`
- `src/app/(supacharger)/(authenticated)/organisation/[org-handle]/settings/layout.tsx`
- `src/app/(supacharger)/(authenticated)/organisation/[org-handle]/settings/page.tsx`
- `src/app/(supacharger)/(authenticated)/organisation/[org-handle]/settings/team/[teamTab]/page.tsx`
- `src/app/(supacharger)/(authenticated)/organisation/[org-handle]/settings/team/page.tsx`
- `src/app/(supacharger)/(authenticated)/organisation/choose/page.tsx`
- `src/app/(supacharger)/api/organisations/route.ts`
- `src/proxy.ts`
- `src/styles/supacharger-organisations.css`
- `src/supacharger.config.ts`
- `src/supacharger/auth/sensitive-auth-query.ts`
- `src/supacharger/organisations/organisation-billing-page.tsx`
- `src/supacharger/organisations/organisation-profile-form.tsx`
- `src/supacharger/organisations/organisation-routes.ts`
- `src/supacharger/organisations/organisation-team.tsx`
- `src/supacharger/supacharger-config-contract.ts`

### supacharger-docs

- `docs/Application Development/account-settings.md`
- `docs/Application Development/folderstructure.mdx`
- `docs/Application Development/global-variables.md`
- `docs/Application Development/organisations.md`
- `docs/Application Development/sitemap.mdx`
- `messages/en.json`
- `sidebars.ts`
- `src/components/AnatomyTree.tsx`
- `src/components/CoreSitemap.tsx`

### supacharger-cli

- `CHANGELOG.md`
- `commands/coreupdate.js`
