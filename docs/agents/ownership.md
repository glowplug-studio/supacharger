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
- `supabase/functions/_shared/image-target-contract.ts`
- `supabase/functions/_shared/image-transform.ts`
- `supabase/functions/process-image-upload/`
- `.supacharger/`

Application developers should not edit these paths. Core maintainers edit them in this canonical repository and distribute approved changes through the CLI.

## Developer-owned paths

`src/supacharger.config.ts` is the application configuration seam. It contains branding, route policy, authentication choices, password requirements, redirects, billing access, Checkout/tax policy, and UI preferences. Every consumer exposes the same option names and shapes through the protected `SupachargerConfig` contract while retaining application-specific values. CLI updates must preserve the settings file byte-for-byte unless a separate, explicit configuration migration is approved. New core configuration keys require a documented configuration migration because preserving the file means consumers do not receive them automatically.

`src/app/layout.tsx` is installed as the starter root-layout template and is then developer-owned. The CLI manifest must preserve it during `coreupdate`; developers may change fonts, body classes, concrete provider implementations, and product-specific head content. Reusable document behaviour belongs in the CLI-managed `src/supacharger/root-document.tsx` helper. That helper owns the metadata factory, page-metadata factory, viewport defaults, optional standard favicon declaration, production-aware robots metadata, and analytics integrations.

The standard favicon layout keeps only `public/favicon.ico` at the public root. The SVG, 96 px PNG, Apple touch icon, 192/512 px web-app icons, and `site.webmanifest` live under `public/favicons/`; metadata and manifest URLs use `/favicons/...`. Favicon artwork remains application-owned, while the directory and URL contract is shared.

The canonical configuration contract exposes `METADATA`, `ROOT_PROVIDERS`, and `ANALYTICS`. Application values may differ, but option names and shapes must not drift. `METADATA.SITE_URL` must be the stable canonical origin, not a preview deployment. Page-specific canonical paths are opt-in through `createSupachargerPageMetadata`; never assign `/` globally as the canonical URL for every route. Google Analytics IDs come from developer configuration or `NEXT_PUBLIC_GOOGLE_ANALYTICS_ID`, never from a hard-coded protected value. The protected analytics helper uses `@next/third-parties/google` and independently honours the Vercel Analytics switch.

The approved social-provider migration is the narrow exception for the expanded `AUTH_PROVDERS_ENABLED` map. The CLI plan reports missing provider keys; the real update backs up the developer config, preserves every existing value, and inserts only missing canonical provider keys with `false`. It must not enable a provider or rewrite unrelated configuration.

`src/i18n/config.ts` and `src/i18n/request.ts` are the application localisation seam. They define supported locales, the default locale, cookie policy, and request-time message loading. CLI updates must preserve them.

`messages/` contains application-owned translation catalogues. If the directory exists, the CLI must preserve the complete directory and must not add, replace, or remove individual locale files during a core update.

`src/styles/project.css` is the application styling seam. It contains the named project's theme tokens, element defaults, global overrides, and product-specific classes. CLI updates must preserve it. It must not import Tailwind because the protected entrypoint already does so.

`src/components/sc_demo/` contains example application presentation that developers may replace.

`src/supacharger.adapters/` is the developer-owned extension seam for additional authentication fields and post-sign-in onboarding operations. Core interfaces may evolve, but the CLI must not overwrite implementations in this directory.

`supabase/functions/_shared/image-targets.ts` is the developer-owned image-processing policy. It maps request target names to fixed buckets, user-relative path prefixes, output formats, resize dimensions, encoding settings, visibility, and limits. The CLI installs a starter only when this file is absent, then preserves it. The managed endpoint and transformer may import this file, but callers must never override its values in request data.

Other routes, features, assets, and components outside managed paths are not automatically CLI-owned. If protected core code depends on them, that dependency needs a stable interface or must be moved behind an explicit core seam.

## Styling ownership

`src/supacharger/styles/globals.css` is the CLI-managed Tailwind entrypoint. Keep it structural: import Tailwind once, then `supacharger.css`, then the developer-owned `src/styles/project.css`.

The root `tailwind.config.ts` is also CLI-managed. It intentionally uses CommonJS syntax while retaining its TypeScript filename, because the root Next.js, PostCSS, and Prettier configuration boundary is CommonJS. Preserve the `@config` path and do not set the whole package to ESM solely to silence Node's module-type warning.

`src/supacharger/styles/supacharger.css` contains reusable Supacharger defaults and semantic component styles. Use Tailwind layers and keep product-specific branding out of this file.

Its base layer owns the pointer-cursor contract for enabled native and ARIA interactive controls. Disabled controls are excluded. It also provides the native smooth-scroll fallback. The editable root layout must mount the protected `SmoothAnchorNavigation` component once so Next.js links receive the same fragment behaviour; do not add competing document-level hash listeners or page-local `scroll-behavior` utilities. The helper respects modified clicks, downloads, non-self targets, missing fragments, the `data-smooth-scroll='false'` opt-out, and `prefers-reduced-motion: reduce`.

`src/supacharger/styles/project.example.css` is a CLI-managed reference and is not imported at runtime. Keep it aligned with the supported project stylesheet pattern.

Prefer utilities in markup. Use `@layer base` for intentional element defaults and theme tokens, `@layer components` for semantic component classes, and `@layer utilities` for narrowly scoped utilities. Do not duplicate rules already supplied by Tailwind Preflight.

## Compatibility interface

Protected code imports `src/supacharger/supacharger-config.ts`. That module contains no settings; it re-exports `SC_CONFIG` from `src/supacharger.config.ts`. This preserves a stable internal import while keeping values outside the update boundary.

## Installation metadata

`.supacharger/core-lock.json` records the upstream repository and installed commit. It is CLI-owned metadata, not application configuration.
