# Changelog

All notable changes to Supacharger Core will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and releases follow [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

> **Note for contributors and agents:** This file documents **Supacharger Core**, maintained automatically by agents acting for **Core contributors**, including contributors working in Core forks. Application developers using Supacharger record their own changes in [CHANGELOG.project.md](CHANGELOG.project.md). Humans should request updates through an agent rather than edit this file manually. Agents may change it only following a human request to update Core release notes (including “do the changelog”) or commit Core changes. An ordinary application commit does not authorise a Core changelog edit; a changelog request alone does not authorise committing or publishing. A Core update may copy upstream release notes unchanged without authoring new entries. Follow Keep a Changelog 1.1.0 and the installed contributor policy and writing skill.
>
> Install the optional [Core contributor instructions](https://github.com/glowplug-studio/supacharger-development-agents.md) at `.agents/supacharger/core-development/`: use `git submodule update --init .agents/supacharger/core-development` when already registered, or `git submodule add git@github.com:glowplug-studio/supacharger-development-agents.md.git .agents/supacharger/core-development` otherwise. Install the writer with `supacharger skills install general/changelog`. See [Contributing to Supacharger](https://supacharger.dev/docs/contributing) for setup and triggers, and [Agent guidance](https://supacharger.dev/docs/agents) for instruction ownership and technical references.

<!-- changelog-review: reviewed_at=2026-11-11T16:11:34Z; base_commit=2014106944c4eb96c47166b1d6d98af2cc8eccda; main_commit=5be0fd78a278106d45d32000c78e9c83c1a381c1; history_start=f8510bcce0759c17578e406bbdf3fa3df5c11cdb; remote_main_commit=5be0fd78a278106d45d32000c78e9c83c1a381c1; scope=account-stylesheet-seam-and-widget-demo-layout; excluded=dirty-core-development-submodule; earlier-history-not-audited -->

## [Unreleased]

### Added

- A removable installation-report extension uses the generated page-hook registry to show the live setup checklist and read-only configuration without an application-layout import. Its draggable avatar, translated copy control, skipped-step state and configuration tab remain local-only and can be removed with the extension folder.

- Public marketing routes now share a persistent App Router layout with route metadata, structured data, sitemap coverage and crawler-readable `llms.txt`. The included-UI gallery adds Shiki source highlighting, a Milkdown editor, click-to-copy and current installed-stack demonstrations.

- Licensed agent skills retain their actual GitHub source repository and immutable commit. The installer refuses cross-repository replacement and can repair a verified legacy local-source provenance record.

- Optional Stripe Data Pipeline reconciliation reads Stripe-managed Product, Price and Subscription snapshots through a service-role-only RPC while retaining signed webhooks for immediate lifecycle events and Stripe API reconciliation for Entitlements. Consumers connect each Supabase project in Stripe Dashboard, apply the Core migration and set `STRIPE_DATA_PIPELINE_SCHEMA`.

- A reusable upgrade preview offers two selectable plans, animated mock payment-method and card screens, and a completion screen with reduced-motion-aware confetti. The widget gallery includes celebration controls and links to the paywall demos; the preview never submits payment details or creates a payment.

- Backend outage recovery preserves sessions, checks availability briefly, then shows a full-page warning with checks every 30 seconds. Protected account pages distinguish temporary outages from invalid sessions. The widget gallery previews the actual 404 and outage presentation, remaining visible until page reload; recovery never automatically replays mutations. The initial Supabase SDK retry policy is unchanged.

- `SUPABASE_AUTH.SESSION.SIGN_OUT_ALL_DEVICES` selects all-device or current-session logout. The default is `true`, preserving existing security behaviour; updates add missing keys without replacing application choices. Changing the value requires rebuilding and deploying the application.

- Extension ownership guidance defines one installable manifest for managed source, consumer configuration, declarative SQL and immutable migrations, with transactional email as the reference package and separate Core-team authoring guidance.

- Declarative database definitions compose Core, extensions and product objects while retaining permanent migration history. Fresh installations receive one verified initial migration rendered from PROJECT_NAMESPACE; existing projects merge namespaced Core definitions and generate their own forward migrations. Protected-object guidance and cloud-edit recovery keep source and deployment history aligned.

- Localised signup notices cover password, passwordless and OAuth account creation with configurable legal destinations. Signup does not require a checkbox; `SIGN_UP_TERMS.REQUIRED` is retained but ignored. Custom auth-action callers must stop passing acceptance arguments. The disposable Core legal demo provides Terms and Privacy anchors.

- Release publication can attach a versioned source ZIP and notify the Core registry to verify its SHA-256 hash and retain superseded release records. Cross-repository Actions credentials are required.

- Applications can select installed extensions as Core service implementations through installed entry points, validated configuration and generated server-only bindings. Transactional email exposes a provider-neutral message contract while delivery queues and transports remain extension-owned.

- Optional extensions install as project-owned source with registry releases and selected-provider dependency checks. Updates compare installed files directly with the incoming source, preserve developer configuration and installed migration history, and offer an agent merge prompt for differing files; versioned ZIP fetching remains deferred.
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

- The developer-owned account presentation seam is now `src/styles/sc_account.css`. Core imports, ownership guidance and repository tooling use the new path; existing consumers should update their import and manifest, while the matching CLI update renames the former stylesheet without replacing product CSS.

- Project UI guidance now prefers installed component-library controls over bare HTML form controls when a suitable accessible primitive exists.

- The starter marketing site uses Kuro branding, refreshed navigation and authentication presentation, and homepage pricing. The former `/pricing` page redirects to `/#pricing`; outage previews use the header’s SVG artwork.
- CLI guidance documents command discovery, dependency installation and registry-backed extension inspection. Namespace preparation accepts the installer’s explicit namespace before dependencies are installed, while normal regeneration still reads application configuration. The repository MCP exposes database namespace, declarative database and widget guidance.

- The default installation now includes a forward migration to `sc_` database schemas and matching Auth, Data API and Edge configuration. Existing installations must coordinate this migration with namespaced Storage and signing secrets; historical migrations remain unchanged.

- Installation guidance now covers registry-selected Core versions, interactive namespace and environment setup, optional skills, extension previews and the distinction between CLI and installed Core versions.

- **Breaking:** `PROJECT_NAMESPACE` is now an installation code used to resolve application-owned Supabase schemas, buckets, Edge Functions, jobs, roles and custom secrets. An empty value selects the mandatory `sc_` prefix; a code such as `wake` selects `sc_wake_`. Choose it before installation and preserve it thereafter. Existing installations require explicit forward migrations, caller updates and hosted configuration changes; changing the value does not migrate deployed resources.
- Application database clients, Edge Functions, extension preparation, generated TypeScript contracts, Bruno requests and repository MCP guidance now resolve names through the shared namespace contract. Regenerate the Edge resource projection and database types after choosing the installation code.

- **Breaking:** Supabase-specific session, method, provider, email and password settings move into `SUPABASE_AUTH`; provider-independent signup consent and the confirmed-account destination remain under `AUTHENTICATION`. Migrate developer-owned config and callers together, retaining application values; older CLI releases must not be assumed to migrate this contract automatically.
- Site titles and descriptions resolve from the active language catalogue with English fallbacks. `METADATA.DEFAULT_OG_IMAGE` replaces `SOCIAL_IMAGE` with default and locale-specific previews; pages can override or suppress them. The title template follows translated branding. Unused logo and Stripe portal-return configuration is removed; standard logo assets remain developer-owned.
- Extension installation and runtime selection no longer require installation receipts, per-file hashes or copied manifests. Required services are declared in build registrations and resolved from installed entry points and configuration; updates compare file contents directly.

- **Breaking:** applications must declare `PROJECT_NAMESPACE` and `CORE_SERVICES`; transactional email may be disabled with a null implementation. Apply the private Core service-binding migration before installing database-backed services. Build registrations declare required Core services instead of selecting delivery providers themselves.

- **Breaking:** the signed image-upload function is named `process_image_upload`. Deploy it with its bundled WASM before releasing updated upload and social-avatar callers; retire previous endpoints only after client rollout. No database migration is required.

- Extension source belongs under `src/app/(project)/(extensions)/(sc_extensions)/`; Supabase workers and forward migrations install into their normal project directories. Commercial implementations remain in their own repositories rather than Core.
- Agent guidance is consolidated under `docs/agents/`, with project UI/icon rules and timestamped reports. Optional extension-development instructions are separate from the instructions installed for application developers.

- **Breaking:** account updates accept one validated profile/extension patch and commit identity, language and product fields together. Move product persistence to private SQL hooks and update callers; the old argument signature is removed.
- Public profile identity has an explicit safe projection. Deploy the Core `profile-media` Supabase function and configure its per-environment origin; public image requests are authorised by Storage on every fetch.

- **Breaking:** `api.initialise_account_username_by_current_user` now requires `fallback_username`. Apply the forward migration and update callers before deploying. Optional and required username flows sanitise the email prefix, then fall back to a standalone, customisable prefix/suffix generator (30 colour prefixes and 100 animal suffixes); collisions use numeric suffixes. Existing usernames and deliberate removals remain unchanged.

- **Breaking:** image uploads use server-signed, user/file-bound permits and the generic `process_image_upload` endpoint. Move product image policies to `src/supacharger.adapters/media/image-targets.ts`, configure matching `IMAGE_UPLOAD_SIGNING_SECRET` values in Next.js and Edge, and update consumers before retiring the old endpoint. Files upload directly to Edge; new target sizes no longer require processor redeployment.

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

- Marketing demo headers now use the licence page's typography and spacing. The Shiki theme picker uses the installed shadcn Select, copy icons have centred controls with deliberate spacing, UI demo actions fill their cards, and the shadcn artwork uses half the available desktop width. Transparent demo artwork meets the footer without a surrounding card, and the source-licence link resolves to `LICENSE.md` without the redundant legal-page link.

- Account settings keep the developer-managed header and navigation visible while asynchronous page content loads, with loading contained to the content area.

- Organisation invitation links confirm successful clipboard writes with timed feedback and report failures. Shared copy controls use a consistent clipboard icon and immediate hover/focus hint.
- Authentication controls and verification text remain legible when the browser uses the light theme without an explicit light class.

- Image fields skip upload indicators when empty or unchanged. Pending images report actual transfer progress to the image processor, with separate indeterminate preparation and processing states instead of fabricated percentages.

- Native declarative planning now has a reconciled migration baseline, with repeatable forward SQL and documented shadow-bootstrap prerequisites. The Node planner remains an optional diagnostic fallback.

- Cancelling social sign-in returns to the login page with a neutral notice, including provider errors delivered in URL fragments. Specific service errors retain their error presentation.

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

- The unused legacy signup carousel, its remaining generic carousel primitive and the `embla-carousel-react` dependency.

- Inactive agent archives, obsolete implementation reports and repository-local editor/Codex settings. Maintainer-local tooling directories are ignored rather than distributed as Core-managed content.
- Bundled local Supabase email overrides and the old `supabase/templates` examples. Email resources are now selected and installed deliberately in hosted Auth; they are excluded from Vercel uploads and Next.js deployment traces.
- Bundled application contract, image-runtime and SQL tests, their package scripts, and the Bruno RPC parity checker. The Core ownership manifest no longer declares these assets or post-update checks; integrations invoking the removed scripts must be updated. The canonical Bruno request collection remains available.

[Unreleased]: https://github.com/glowplug-studio/supacharger/compare/f8510bcce0759c17578e406bbdf3fa3df5c11cdb...HEAD
