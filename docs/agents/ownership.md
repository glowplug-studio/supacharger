# File ownership and extension model

## CLI-managed paths

The CLI-managed core currently occupies:

- `src/supacharger/`
- `src/app/(supacharger)/`
- `src/lib/supabase/supacharger/`
- `.supacharger/`

Application developers should not edit these paths. Core maintainers edit them in this canonical repository and distribute approved changes through the CLI.

## Developer-owned paths

`src/supacharger.config.ts` is the application configuration seam. It contains branding, route policy, authentication choices, password requirements, redirects, subscription behaviour, and UI preferences. CLI updates must preserve it byte-for-byte unless a separate, explicit configuration migration is approved.

`src/components/sc_demo/` contains example application presentation that developers may replace.

Other routes, features, assets, and components outside managed paths are not automatically CLI-owned. If protected core code depends on them, that dependency needs a stable interface or must be moved behind an explicit core seam.

## Compatibility interface

Protected code imports `src/supacharger/supacharger-config.ts`. That module contains no settings; it re-exports `SC_CONFIG` from `src/supacharger.config.ts`. This preserves a stable internal import while keeping values outside the update boundary.

## Installation metadata

`.supacharger/core-lock.json` records the upstream repository and installed commit. It is CLI-owned metadata, not application configuration.
