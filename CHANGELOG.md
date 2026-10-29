# Changelog

All notable changes to Supacharger Core will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and releases follow [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

> **Note for contributors and agents:** This file documents **Supacharger Core**, maintained automatically by agents acting for **Core contributors**, including contributors working in Core forks. Application developers using Supacharger record their own changes in [CHANGELOG.project.md](CHANGELOG.project.md). Humans should request updates through an agent rather than edit this file manually. Agents may change it only following a human request to update Core release notes (including “do the changelog”) or commit Core changes. An ordinary application commit does not authorise a Core changelog edit; a changelog request alone does not authorise committing or publishing. A Core update may copy upstream release notes unchanged without authoring new entries. Follow Keep a Changelog 1.1.0 and the installed contributor policy and writing skill.
>
> Install the optional [Core contributor instructions](https://github.com/glowplug-studio/supacharger-development-agents.md) at `.agents/supacharger/core-development/`: use `git submodule update --init .agents/supacharger/core-development` when already registered, or `git submodule add git@github.com:glowplug-studio/supacharger-development-agents.md.git .agents/supacharger/core-development` otherwise. Install the writer with `supacharger skills install general/changelog`. See [Contributing to Supacharger](https://supacharger.dev/docs/contributing) for setup and triggers, and [Agent guidance](https://supacharger.dev/docs/agents) for instruction ownership and technical references.

<!-- changelog-review: reviewed_at=2026-10-29T09:45:35.034052Z; base_commit=ad46834dae3a0a3a530dae88db8442672ede35d3; main_commit=ad46834dae3a0a3a530dae88db8442672ede35d3; history_start=f8510bcce0759c17578e406bbdf3fa3df5c11cdb; remote_main_commit=ad46834dae3a0a3a530dae88db8442672ede35d3; scope=banner-replacement-and-prior-checkpoint-review; excluded=unrelated-local-core-working-tree-changes; earlier-history-not-audited -->

## [Unreleased]

### Added

- Optional extensions install as project-owned source, with verified SHA-256 payloads, registry releases and selected-provider dependency checks. Updates compare the original release with installed files and offer an agent merge prompt when local changes need review; versioned ZIP fetching remains deferred.
- A generic build helper selects installed extension code or an application-owned unavailable implementation, including namespaced next-intl UI messages. Database changes remain explicit administrative operations.

- A developer-owned login/signup modal widget using the configured authentication flow, with a feature-gating demonstration.

- Resumable installation guidance with a developer-owned first-install record and a separate CLI-managed upstream checklist, plus links to the full online Markdown documentation.

- Optional Auth, security-notification and Brevo email resources under developer-owned `resources/sc-email-templates`, with read-only MCP access to complete HTML and setup guidance.
- A replaceable default email logo for application-owned branding.
- Upload simulations with visible progress, loading-indicator previews, and modal and toast demonstrations in the starter widget gallery.
- Free public agent skill installation with checkbox selection, named installs, pinned Git revisions and explicit updates that preserve local customisations. The canonical installer is distributed through the Supacharger CLI separately from paid modules.
- Separate application instructions, technical references and optional Core contributor guidance, with documented installation and a reusable changelog-writing skill.
- A developer-owned application changelog alongside contributor-maintained Core release notes.

### Changed

- Extension source belongs under `src/app/(project)/(extensions)/(sc_extensions)/`; Supabase workers and forward migrations install into their normal project directories. Commercial implementations remain in their own repositories rather than Core.
- Agent guidance is consolidated under `docs/agents/`, with project UI/icon rules and timestamped reports. Optional extension-development instructions are separate from the instructions installed for application developers.

- **Breaking:** account updates accept one validated profile/extension patch and commit identity, language and product fields together. Move product persistence to private SQL hooks and update callers; the old argument signature is removed.
- Public profile identity has an explicit safe projection. Deploy the Core `profile-media` Supabase function and configure its per-environment origin; public image requests are authorised by Storage on every fetch.

- **Breaking:** image uploads use server-signed, user/file-bound permits and the generic `process-image-upload-v2` endpoint. Move product image policies to `src/supacharger.adapters/media/image-targets.ts`, configure matching `IMAGE_UPLOAD_SIGNING_SECRET` values in Next.js and Edge, and update consumers before retiring the old endpoint. Files upload directly to Edge; new target sizes no longer require processor redeployment.

- The Core demo enables organisation creation, switching, invitations and settings. Consumer feature flags, registration organisation fields and organisation billing remain independently configured.

- **Breaking:** organisation selection moves to the standalone `/organisation/choose` page and settings move to `/organisation/{org-handle}/settings`. `/organisation` redirects with HTTP 301; previous chooser and root-handle settings routes are removed without redirects. Update developer-owned links and return destinations, and use `CHOOSER_PATH: "/organisation/choose"` with `ROUTE_MODE: "organisation-handle"`.

- The durable setup and distribution review records CLI 1.1.0 as release-ready at commit `be5e782`, with npm publication and a clean public `@latest` installation remaining.

- The `docs/reports/sc-install/` directory is reserved for installation records and required installation evidence. General audits and upgrade reviews use the normal reports location. CLI-generated `.supacharger/backups/` are documented as temporary local recovery copies that should not be committed.

- Remote setup now hands over immediately after obtaining Core and loading handhold-me. The local first-install checklist owns the remaining wizard and Core configuration, saving progress before skill installation and after each step so interrupted setup can resume.

- Installation reports remain committable but are excluded from deployment uploads and traced runtime bundles. System prerequisites are installed manually before agent setup.

- Optional email examples use smaller headings, body text and content padding, with a revised default email logo.

- Email-template guidance checks application Auth and provider intent against hosted settings and implemented flows before selecting tokens, reports contradictions, and supports the Management API when Supabase MCP cannot edit Auth settings.

- Auth callbacks, email destinations, Stripe returns and session-transfer links preserve the validated initiating domain. `NEXT_PUBLIC_SITE_URL` remains canonical for metadata and background links; optional server-only `APP_ALLOWED_ORIGINS` accepts additional exact custom origins. Canonical and exact Vercel deployment origins are recognised automatically.
- Callback adapters must pass the request origin to `getAuthLoginRedirect(destination, origin)` and construct their return URLs on that origin. Existing developer-owned adapters and hosted templates require the documented upgrade.
- Session renewal now uses Supabase’s standard SSR clients and verified claims, with the SDK owning refresh retries, token rotation and cookie updates. Custom refresh-response caching and manual session-cookie extraction have been removed.
- Existing application technical references are preserved during Core updates; missing references are installed for deliberate review alongside runtime changes. Installed Core skills and their records remain local tooling.
- Image selection opens a repositioning dialog automatically. Banner crops support vertical movement, avatar crops retain free movement and zoom, and applications can supply crop-dialog wording and image-processing progress.
- Dialogs support an optional centred fade transition while preserving their default animation.
- Core updates preserve project instructions and installed skills; shared agent guidance and Core release notes have explicit ownership.

### Fixed

- Image crop previews retain their aspect ratio in scrolling dialogs, with clearer zoom controls and no overlap between the drag surface and slider.

- The image-authorisation route uses the default Node runtime, allowing Cache Components builds.

- Client Components can initialise the shared Supabase browser client during server rendering without cookie configuration errors; browser sessions retain token-only cookies and separate user storage.

- Passwordless sign-in validates the current email input, including browser autofill, shows accessible invalid-email feedback and clears pending state when sending fails.

- Password reset and account-security forms explain when the new password matches the current password, instead of showing a generic update failure.

- Password-reset forms retain their green Sent action alongside the resend countdown, with loading and sent feedback for resends. Email-change action links have centred labels and developer-owned padding and colour controls.

- Logout reaches its cookie-clearing handler even when the session has expired or disappeared, preventing POST redirects to login and subsequent 405 errors. Logout responses are never cached.

- Password recovery now keeps an inbox confirmation and timed resend action visible. Legacy root token links reach verification, and email changes distinguish the first inbox confirmation, completed PKCE/token verification and invalid links.
- A forward migration reconciles older profiles with nullable usernames so administrative creation and invitations retain automatic profile creation.

- Password recovery accepts Supabase’s token-hash verification without requiring a `recovery` AMR that this flow does not issue. The new-password page and API verify the current non-anonymous user, and Supabase authorises `updateUser`. Deploy the updated Core routes together; no database migration or additional recovery credential is required.

- Password recovery verifies email token hashes through `/auth/confirm`, so new reset links can be opened without the requesting browser’s PKCE verifier. Deploy the application and install the recovery template using `RedirectTo` plus `?token_hash=...&type=recovery` in hosted Supabase Auth. The supplied redirect is `/auth/confirm`, with no redundant `next` parameter; register that callback on each supported domain. Local template configuration does not update hosted projects. Legacy PKCE callbacks remain supported.
- Invalid, expired or consumed recovery links display a dedicated retry action and cannot reuse an unrelated signed-in session. Recovery destinations are fixed, and confirmation redirects prevent caching and referrer disclosure.
- Account summaries skip organisation-avatar signing when organisations are disabled. Organisation loading redirects only for missing or inaccessible records and preserves other failures.

### Removed

- Bundled local Supabase email overrides and the old `supabase/templates` examples. Email resources are now selected and installed deliberately in hosted Auth; they are excluded from Vercel uploads and Next.js deployment traces.
- Bundled application contract, image-runtime and SQL tests, their package scripts, and the Bruno RPC parity checker. The Core ownership manifest no longer declares these assets or post-update checks; integrations invoking the removed scripts must be updated. The canonical Bruno request collection remains available.

[Unreleased]: https://github.com/glowplug-studio/supacharger/compare/f8510bcce0759c17578e406bbdf3fa3df5c11cdb...HEAD
