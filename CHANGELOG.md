# Changelog

All notable changes to Supacharger Core will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and releases follow [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

> **Note for contributors and agents:** This file documents **Supacharger Core**, maintained automatically by agents acting for **Core contributors**, including contributors working in Core forks. Application developers using Supacharger record their own changes in [CHANGELOG.project.md](CHANGELOG.project.md). Humans should request updates through an agent rather than edit this file manually. Agents may change it only following a human request to update Core release notes (including “do the changelog”) or commit Core changes. An ordinary application commit does not authorise a Core changelog edit; a changelog request alone does not authorise committing or publishing. A Core update may copy upstream release notes unchanged without authoring new entries. Follow Keep a Changelog 1.1.0 and the installed contributor policy and writing skill.
>
> Install the optional [Core contributor instructions](https://github.com/glowplug-studio/supacharger-development-agents.md) at `.agents/supacharger/core-development/`: use `git submodule update --init .agents/supacharger/core-development` when already registered, or `git submodule add git@github.com:glowplug-studio/supacharger-development-agents.md.git .agents/supacharger/core-development` otherwise. Install the writer with `supacharger skills install general/changelog`. See [Contributing to Supacharger](https://supacharger.dev/docs/contributing) for setup and triggers, and [Agent guidance](https://supacharger.dev/docs/agents) for instruction ownership and technical references.

<!-- changelog-review: reviewed_at=2026-09-13T16:37:08Z; base_commit=08164342859d34b6a1e15a69066d1bc934b5259c; main_commit=08164342859d34b6a1e15a69066d1bc934b5259c; history_start=f8510bcce0759c17578e406bbdf3fa3df5c11cdb; remote_main_commit=08164342859d34b6a1e15a69066d1bc934b5259c; scope=main-and-auth-recovery-change-set; excluded=staged-contributor-submodule-guidance-localisation-svg-email-logo-and-local-incident-report; earlier-history-not-audited -->

## [Unreleased]

### Added

- Upload simulations with visible progress, loading-indicator previews, and modal and toast demonstrations in the starter widget gallery.
- Free public agent skill installation with checkbox selection, named installs, pinned Git revisions and explicit updates that preserve local customisations. The canonical installer is distributed through the Supacharger CLI separately from paid modules.
- Separate application instructions, technical references and optional Core contributor guidance, with documented installation and a reusable changelog-writing skill.
- A developer-owned application changelog alongside contributor-maintained Core release notes.

### Changed

- Session renewal now uses Supabase’s standard SSR clients and verified claims, with the SDK owning refresh retries, token rotation and cookie updates. Custom refresh-response caching and manual session-cookie extraction have been removed.
- Existing application technical references are preserved during Core updates; missing references are installed for deliberate review alongside runtime changes. Installed Core skills and their records remain local tooling.
- Image selection opens a repositioning dialog automatically. Banner crops support vertical movement, avatar crops retain free movement and zoom, and applications can supply crop-dialog wording and image-processing progress.
- Dialogs support an optional centred fade transition while preserving their default animation.
- Core updates preserve project instructions and installed skills; shared agent guidance and Core release notes have explicit ownership.

### Fixed

- Password recovery verifies email token hashes through `/auth/confirm`, so new reset links can be opened without the requesting browser’s PKCE verifier. Deploy the application, install the supplied recovery template in hosted Supabase Auth, and set its Site URL to the application’s canonical HTTPS origin; local template configuration does not update hosted projects. Legacy PKCE callbacks remain supported.
- Invalid, expired or consumed recovery links display a dedicated retry action and cannot reuse an unrelated signed-in session. Recovery destinations are fixed, verified recovery claims are required, and confirmation redirects prevent caching and referrer disclosure.
- Account summaries skip organisation-avatar signing when organisations are disabled. Organisation loading redirects only for missing or inaccessible records and preserves other failures.

### Removed

- Bundled application contract, image-runtime and SQL tests, their package scripts, and the Bruno RPC parity checker. The Core ownership manifest no longer declares these assets or post-update checks; integrations invoking the removed scripts must be updated. The canonical Bruno request collection remains available.

[Unreleased]: https://github.com/glowplug-studio/supacharger/compare/f8510bcce0759c17578e406bbdf3fa3df5c11cdb...HEAD
