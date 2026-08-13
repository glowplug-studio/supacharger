# File ownership and extension model

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

`src/supacharger.config.ts` is the application configuration seam. It contains branding, route policy, authentication choices, password requirements, redirects, subscription behaviour, and UI preferences. CLI updates must preserve it byte-for-byte unless a separate, explicit configuration migration is approved.

`src/i18n/config.ts` and `src/i18n/request.ts` are the application localisation seam. They define supported locales, the default locale, cookie policy, and request-time message loading. CLI updates must preserve them.

`messages/` contains application-owned translation catalogues. If the directory exists, the CLI must preserve the complete directory and must not add, replace, or remove individual locale files during a core update.

`src/styles/project.css` is the application styling seam. It contains the named project's theme tokens, element defaults, global overrides, and product-specific classes. CLI updates must preserve it. It must not import Tailwind because the protected entrypoint already does so.

`src/components/sc_demo/` contains example application presentation that developers may replace.

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
