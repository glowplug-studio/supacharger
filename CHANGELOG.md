# Changelog

All notable changes to Supacharger Core will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and releases follow [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

> **Note for contributors and agents:** This file documents **Supacharger Core**, maintained automatically by agents acting for **Core contributors**, including contributors working in Core forks. Application developers using Supacharger record their own changes in [CHANGELOG.project.md](CHANGELOG.project.md). Humans should request updates through an agent rather than edit this file manually. Agents may change it only following a human request to update Core release notes (including “do the changelog”) or commit Core changes. An ordinary application commit does not authorise a Core changelog edit; a changelog request alone does not authorise committing or publishing. A Core update may copy upstream release notes unchanged without authoring new entries. Follow Keep a Changelog 1.1.0 and the installed contributor policy and writing skill.
>
> Install the optional [Core contributor instructions](https://github.com/glowplug-studio/supacharger-development-agents.md) at `.agents/supacharger/core-development/`: use `git submodule update --init .agents/supacharger/core-development` when already registered, or `git submodule add git@github.com:glowplug-studio/supacharger-development-agents.md.git .agents/supacharger/core-development` otherwise. Install the writer with `supacharger skills install general/changelog`. See [Contributing to Supacharger](https://supacharger.dev/docs/contributing) for setup and triggers, and [Agent guidance](https://supacharger.dev/docs/agents) for instruction ownership and technical references.

<!-- changelog-review: reviewed_at=2026-09-13T20:18:58Z; base_commit=f5af049463749de17374bbf5c8e5f11372c40b7a; main_commit=f5af049463749de17374bbf5c8e5f11372c40b7a; history_start=f8510bcce0759c17578e406bbdf3fa3df5c11cdb; remote_main_commit=f5af049463749de17374bbf5c8e5f11372c40b7a; scope=auth-recovery-and-profile-reconciliation; excluded=separate-documentation-repository-and-hosted-project-settings; earlier-history-not-audited -->

## [Unreleased]

### Added

- Optional Auth, security-notification and Brevo email resources under developer-owned `resources/sc-email-templates`, with read-only MCP access to complete HTML and setup guidance.
- A replaceable default email logo for application-owned branding.
- Upload simulations with visible progress, loading-indicator previews, and modal and toast demonstrations in the starter widget gallery.
- Free public agent skill installation with checkbox selection, named installs, pinned Git revisions and explicit updates that preserve local customisations. The canonical installer is distributed through the Supacharger CLI separately from paid modules.
- Separate application instructions, technical references and optional Core contributor guidance, with documented installation and a reusable changelog-writing skill.
- A developer-owned application changelog alongside contributor-maintained Core release notes.

### Changed

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
