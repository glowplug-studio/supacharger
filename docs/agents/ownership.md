# File ownership and extension model

## Versioned ownership manifest

`.supacharger/managed-files.json` is the authoritative versioned list of managed and developer-owned paths plus post-update checks. `coreupdate --plan` compares the installed baseline with latest core without changing project files or a database. A real update writes only managed paths, removes obsolete managed files, backs up overwritten files under `.supacharger/backups/`, installs changed dependencies, previews linked migrations, verifies the linked ledger after an approved push, runs declared checks, and advances the core lock only after completion.

## CLI-managed paths

The CLI-managed core currently occupies:

- `src/supacharger/`
- `src/app/(supacharger)/`
- `src/lib/supabase/supacharger/`
- `src/lib/stripe/`
- `src/features/pricing/`
- shared billing controllers in `src/features/account/controllers/`
- `supabase/migrations/`
- `.supacharger/`

Application developers should not edit these paths. Core maintainers edit them in this canonical repository and distribute approved changes through the CLI.

## Developer-owned paths

`src/supacharger.config.ts` is the application configuration seam. It contains branding, route policy, authentication choices, password requirements, redirects, billing access, Checkout/tax policy, and UI preferences. Every consumer exposes the same option names and shapes through the protected `SupachargerConfig` contract while retaining application-specific values. CLI updates must preserve the settings file byte-for-byte unless a separate, explicit configuration migration is approved. New core configuration keys require a documented configuration migration because preserving the file means consumers do not receive them automatically.

`src/i18n/config.ts` and `src/i18n/request.ts` are the application localisation seam. They define supported locales, the default locale, cookie policy, and request-time message loading. CLI updates must preserve them.

`messages/` contains application-owned translation catalogues. If the directory exists, the CLI must preserve the complete directory and must not add, replace, or remove individual locale files during a core update.

`src/styles/project.css` is the application styling seam. It contains the named project's theme tokens, element defaults, global overrides, and product-specific classes. CLI updates must preserve it. It must not import Tailwind because the protected entrypoint already does so.

`src/components/sc_demo/` contains example application presentation that developers may replace.

`src/supacharger.adapters/` is the developer-owned extension seam for additional authentication fields and post-sign-in onboarding operations. Core interfaces may evolve, but the CLI must not overwrite implementations in this directory.

Other routes, features, assets, and components outside managed paths are not automatically CLI-owned. If protected core code depends on them, that dependency needs a stable interface or must be moved behind an explicit core seam.

## Styling ownership

`src/supacharger/styles/globals.css` is the CLI-managed Tailwind entrypoint. Keep it structural: import Tailwind once, then `supacharger.css`, then the developer-owned `src/styles/project.css`.

`src/supacharger/styles/supacharger.css` contains reusable Supacharger defaults and semantic component styles. Use Tailwind layers and keep product-specific branding out of this file.

`src/supacharger/styles/project.example.css` is a CLI-managed reference and is not imported at runtime. Keep it aligned with the supported project stylesheet pattern.

Prefer utilities in markup. Use `@layer base` for intentional element defaults and theme tokens, `@layer components` for semantic component classes, and `@layer utilities` for narrowly scoped utilities. Do not duplicate rules already supplied by Tailwind Preflight.

## Compatibility interface

Protected code imports `src/supacharger/supacharger-config.ts`. That module contains no settings; it re-exports `SC_CONFIG` from `src/supacharger.config.ts`. This preserves a stable internal import while keeping values outside the update boundary.

## Installation metadata

`.supacharger/core-lock.json` records the upstream repository and installed commit. It is CLI-owned metadata, not application configuration.
