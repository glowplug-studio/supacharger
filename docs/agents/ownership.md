# File ownership and extension model

## Versioned ownership manifest

`.supacharger/managed-files.json` is the authoritative versioned ownership contract. Version 2 separates exact managed paths, merge-managed contracts, forward-only migration histories and developer-owned paths. `coreupdate --plan` compares the installed baseline with latest Core without changing project files or a database. A real update replaces only exact managed paths, merges approved dependency contracts, copies only new forward migrations, backs up overwritten files and advances the Core lock after direct file comparison succeeds.

## CLI-managed paths

The byte-identical CLI-managed core currently occupies the paths listed in `managedPaths`, including:

- `src/supacharger/`
- `src/app/(supacharger)/`
- `src/lib/supabase/client.ts`
- `src/lib/supabase/server.ts`
- `src/lib/supabase/supacharger/`
- `postcss.config.mjs`
- `supabase/functions/_shared/image-target-contract.ts`
- `supabase/functions/_shared/image-transform.ts`
- `supabase/functions/process-image-upload/`
- `docs/bruno/supacharger-rpc/`
- `.supacharger/managed-files.json`

Application developers should not edit exact managed paths. Core maintainers edit them in this canonical repository and distribute approved changes through the CLI. The managed browser, server, and Proxy Supabase clients keep `tokens-only` cookie encoding aligned; consumers must not replace one client independently because mixed encodings can expand or invalidate refreshed session state. Reusable authentication and account routes live under `src/app/(supacharger)/`; product routes and extensions live under `src/app/(project)/`. Authentication presentation is customised through the explicit developer seams below, not by duplicating a managed public route.

## Merge-managed contracts

`package.json`, `package-lock.json`, and `supabase/config.toml` are not byte-replaced. The CLI merges canonical dependency requirements while preserving existing product dependencies and scripts, then regenerates the lock through the package manager when dependencies change. Supabase local configuration retains project-specific values and requires contract-aware merge logic. `tailwind.config.ts` is exact managed; application Tailwind additions belong in developer-owned `tailwind.project.config.ts`.

## Forward-only migration history

`supabase/migrations/` is permanent per-project history. Core updates may copy a new canonical migration only when its filename is absent. A differing migration with the same filename is a conflict and must halt safely. The CLI must never replace, delete, reorder, or rewrite an installed migration, and a file backup is not a database rollback.

When a consumer has already landed an intentionally adapted equivalent under a different immutable filename, declare the exact canonical-to-local mapping in developer-owned `.supacharger/migration-aliases.json`. The updater validates that the replacement exists, reports the alias in `--plan`, and does not copy or apply the canonical file. Never use an alias to conceal an unreviewed or partially equivalent migration.

Stripe libraries under `src/lib/stripe/`, billing controllers under `src/features/`, and generated database types are application integration code unless a future manifest explicitly classifies an individual path. They may implement the same shared behaviour with application schema adapters; exact protected Route Handlers depend on their stable interfaces rather than owning product table shapes.

## Developer-owned paths

`src/supacharger.config.ts` is the application configuration seam. It contains branding, route policy, authentication choices, password requirements, redirects, billing access, Checkout/tax policy, and UI preferences. Every consumer exposes the same option names and shapes through the protected `SupachargerConfig` contract while retaining application-specific values. CLI updates must preserve the settings file byte-for-byte unless a separate, explicit configuration migration is approved. New core configuration keys require a documented configuration migration because preserving the file means consumers do not receive them automatically.

### Consumer configuration approval boundary

Follow `.agents/supacharger/guidance.md` for the authoritative project/Core approval gates. Ownership descriptions here do not grant permission to change protected contracts.

`src/app/layout.tsx` is installed as the starter root-layout template and is then developer-owned. The CLI manifest must preserve it during `coreupdate`; developers may change fonts, body classes, concrete provider implementations, and product-specific head content. Reusable document behaviour belongs in the CLI-managed `src/supacharger/root-document.tsx` helper. That helper owns the metadata factory, page-metadata factory, viewport defaults, optional standard favicon declaration, production-aware robots metadata, and analytics integrations.

The standard favicon layout keeps only `public/favicon.ico` at the public root. The SVG, 96 px PNG, Apple touch icon, 192/512 px web-app icons, and `site.webmanifest` live under `public/favicons/`; metadata and manifest URLs use `/favicons/...`. Favicon artwork remains application-owned, while the directory and URL contract is shared.

The canonical configuration contract exposes `METADATA`, `ROOT_PROVIDERS`, and `ANALYTICS`. Application values may differ, but option names and shapes must not drift. `METADATA.SITE_URL` must be the stable canonical origin, not a preview deployment. Page-specific canonical paths are opt-in through `createSupachargerPageMetadata`; never assign `/` globally as the canonical URL for every route. Google Analytics IDs come from developer configuration or `NEXT_PUBLIC_GOOGLE_ANALYTICS_ID`, never from a hard-coded protected value. The protected analytics helper uses `@next/third-parties/google` and independently honours the Vercel Analytics switch.

The approved social-provider migration is the narrow exception for the expanded `AUTH_PROVDERS_ENABLED` map. The CLI plan reports missing provider keys; the real update backs up the developer config, preserves every existing value, and inserts only missing canonical provider keys with `false`. It must not enable a provider or rewrite unrelated configuration.

`src/i18n/config.ts` and `src/i18n/request.ts` are the application localisation seam. They define supported locales, the default locale, cookie policy, and request-time message loading. CLI updates must preserve them.

`messages/` contains application-owned translation catalogues. The CLI never creates, replaces, or deletes secondary locale files during an update. It recursively adds missing canonical English keys to `messages/en.json`, fills an empty English value from Core, and preserves every existing non-empty application value. This keeps managed routes runnable without standardising product wording or inventing translations.

`src/styles/project.css` is the application styling seam. It contains the named project's theme tokens, element defaults, global overrides, and product-specific classes. CLI updates must preserve it. It must not import Tailwind because the protected entrypoint already does so.

`src/styles/supacharger-auth.css` is the authentication presentation seam. The managed authentication shell and forms expose semantic `sc-auth-*` hooks; this file assigns product colours, dimensions, responsive layout, and interaction presentation. The CLI copies the starter only when the file is absent and preserves established application CSS during later updates.

`src/styles/supacharger-account.css` and `src/styles/supacharger-organisations.css` are the equivalent presentation seams for managed account and organisation surfaces. Their managed JSX exposes only `sc-account-*`, `sc-organisation-*`, and shared `sc-control-*` hooks. Keep all layout, spacing, typography, colours, borders, dimensions, responsive behaviour, and interaction styling in these unlayered developer files. The CLI installs missing starters and preserves established application CSS thereafter.

Scope every shared `sc-control-*` rule in those unlayered stylesheets to the account or organisation surface roots that own it. Never leave a generic control selector at the stylesheet root: unlayered normal declarations outrank authentication rules inside `@layer components`, regardless of selector specificity.

`src/assets/svgr/ui/inline-loader.svg` is the primary application-owned inline loading animation, and `src/assets/svgr/ui/inline-loader-dark.svg` is its optional black variant. The shared loading component uses the primary asset. Replace either file in place to brand it; do not rename it or put UI SVGs in `public`. Import UI SVGs as SVGR components rather than `<img>`, `next/image`, or public URL strings unless an external URL contract explicitly requires otherwise. Both supplied loaders accept an SVGR `fill` prop, while a custom asset may hard-code colours and ignore that prop without breaking callers. CLI updates preserve both files.

### UI SVG ownership and responsive sizing

See [SVG guidance](svg-guidance.md) for placement, SVGR imports, sizing and verification. Assets retain the developer ownership described above.

`src/components/sc_demo/` contains example application presentation that developers may replace. Keep demo-only assets beneath this directory so removing the demo also removes its assets. Import its UI SVGs as SVGR components; do not place them in `public/` unless they require a stable public URL independently of the demo.

`src/components/sc_widgets/` contains Supacharger-provided, project-owned widgets. `supacharger init` supplies the initial implementation and Core updates preserve the whole directory. The current updater does not add widget files introduced later; copy an approved new widget into each application explicitly. Keep composed upload, crop, profile preview, attribution, error and layout presentation here. Keep shadcn primitives in `src/components/ui/` and complete demonstrations in `src/components/sc_demo/`. Read `docs/agents/project-widgets.md` for the image policy and upload boundaries.

`src/app/error/page.tsx`, `src/app/not-found.tsx`, and `src/components/sc_widgets/error-page/` are application-owned error presentation. Keep them outside the protected `(supacharger)` route group. The canonical starter verifies the user on the server, adds the existing authenticated header and footer only for a verified session, and otherwise renders a standalone full-viewport state. Use the developer-owned semantic theme tokens (`primary`, `primary-foreground`, `foreground`, `muted-foreground`, `accent`, and `ring`) rather than product-specific colour literals. Resolve copy from the developer-owned `ErrorPage` namespace without calling `getTranslations` for a namespace that may be absent: the shared resolver must fall back field-by-field to its protected English copy so preserved or stale catalogues cannot break the error boundary. When `AUTH_ONLY_APP` is enabled, the developer config must explicitly allow `/error` for unauthenticated visitors. Proxy must also let `/error` bypass post-sign-in profile onboarding so another redirect cannot conceal the error.

`src/supacharger.adapters/` is the developer-owned extension seam for authentication, account, billing, and organisation integrations. `auth/auth-sidecar.tsx` must export `AuthSidecar` and `AuthMobileBrand`; account `chrome.tsx` owns the outer header, application sidebar, and footer around the managed settings shell; organisation `pages.tsx`, `navigation.ts`, and `chrome.tsx` preserve product-only settings behaviour and application chrome; and `profile-fields.tsx` plus `profile-extension.ts` form the organisation profile UI/server pair. The Core account starter uses the example `AuthenticatedAppShell`, but consumers may replace it without changing managed forms. Core interfaces may evolve, but the CLI installs each missing starter and must not overwrite established implementations in this directory.

`supabase/functions/_shared/image-targets.ts` is the developer-owned image-processing policy. It maps request target names to fixed buckets, fallback user-relative path prefixes, output formats, resize dimensions, encoding settings, visibility, and limits. The CLI installs a starter only when this file is absent, then preserves it. The managed endpoint accepts a validated destination below the authenticated user's ID; callers cannot override buckets, ownership, filenames or output transform values. An optional validated `crop` rectangle selects source pixels after orientation and before the target resize.

Other routes, features, assets, and components outside managed paths are not automatically CLI-owned. If protected core code depends on them, that dependency needs a stable interface or must be moved behind an explicit core seam.

## Build-runtime boundary

The root `tsconfig.json` belongs to the Next.js application runtime and must exclude `supabase/functions/**/*`. Supabase Edge Functions belong to Deno and may use Deno globals, explicit `.ts` imports, URL imports, and `jsr:` packages that the Next.js TypeScript program must not resolve. Keep this exclusion identical in Core and consumers without weakening either runtime's compiler settings.

## Styling ownership

`src/supacharger/styles/globals.css` is the CLI-managed Tailwind entrypoint. Keep it structural: import Tailwind once, then `supacharger.css`, then the developer-owned authentication, account, organisation, and project stylesheets in their canonical order.

The root `tailwind.config.ts` is exact Core-managed and imports `tailwind.project.config.ts` as a Tailwind preset. The preset is developer-owned, starts empty, and is where a project or extension installer adds Tailwind plugins, additive theme choices, or other configuration. Keep ordinary product tokens and styling in `src/styles/project.css`. During the ownership transition, the CLI may replace an unchanged historical root configuration; it must stop when that legacy file contains project changes so they can be moved into the preset. `postcss.config.mjs` is exact managed and uses an explicit ESM export for reliable Next.js/Turbopack loading. Preserve the `@config` path and do not set the whole package to ESM solely to load Tailwind configuration.

`src/supacharger/styles/supacharger.css` contains reusable Supacharger defaults and semantic component styles. Use Tailwind layers and keep product-specific branding out of this file.

Its base layer owns the pointer-cursor contract for enabled native and ARIA interactive controls. Disabled controls are excluded. It also provides the native smooth-scroll fallback. The editable root layout must mount the protected `SmoothAnchorNavigation` component once so Next.js links receive the same fragment behaviour; do not add competing document-level hash listeners or page-local `scroll-behavior` utilities. The helper respects modified clicks, downloads, non-self targets, missing fragments, the `data-smooth-scroll='false'` opt-out, and `prefers-reduced-motion: reduce`.

`src/supacharger/styles/project.example.css` is a CLI-managed reference and is not imported at runtime. Keep it aligned with the supported project stylesheet pattern.

Project-owned components may prefer utilities in markup. Managed authentication, account, and organisation presentation markup must instead use its documented semantic hooks so consumers can restyle the complete surface without editing CLI-owned JSX. In authentication styles, compose standard Tailwind presentation inside those semantic classes with `@apply`; reserve ordinary CSS declarations for product variables, pseudo-elements, custom transitions or animation, and behaviour outside Tailwind's standard utilities. In other stylesheets, use `@layer base` for intentional element defaults and theme tokens, `@layer components` for semantic component classes, and `@layer utilities` for narrowly scoped utilities. Do not duplicate rules already supplied by Tailwind Preflight.

The main brand action pair is `--primary` plus `--primary-foreground`. Tailwind maps these space-separated HSL channels to `bg-primary` and `text-primary-foreground`; related neutral and interaction tokens map to `text-foreground`, `text-muted-foreground`, `bg-accent`, and `ring-ring`. Reusable presentation should consume these semantic mappings rather than embed a consumer's hex colour.

## Compatibility interface

Protected code imports `src/supacharger/supacharger-config.ts`. That module contains no settings; it re-exports `SC_CONFIG` from `src/supacharger.config.ts`. This preserves a stable internal import while keeping values outside the update boundary.

## Installation metadata

`.supacharger/core-lock.json` records the upstream repository and installed commit. It is CLI-owned metadata, not application configuration.

`.supacharger/backups/<timestamp>/` contains local recovery copies created by the CLI before it overwrites or removes files during an update. It is not the installed Core baseline or a complete transactional rollback. Keep a backup until the update and project diff have been reviewed, then remove it deliberately when it is no longer needed. Do not commit backup contents.

## Image loading placeholders

See [loading UI](loading-ui.md) for the image loader lifecycle and [project widgets](project-widgets.md) for its wrapper. The assets and editable widgets remain developer-owned.

## Agent guidance and changelog ownership

The manifest makes `.agents/supacharger/guidance.md` and `CHANGELOG.md` exact-managed. Root `AGENTS.md`, `.agents/project/`, `.agents/instructions/`, `.agents/skills/`, `.agents/legacy/`, the optional `.agents/supacharger/core-development/` checkout, `.gitmodules`, `CHANGELOG.project.md` and `.supacharger/skills-lock.json` are preserved during Core updates. The dedicated `supacharger coredev install` and `supacharger coredev update` commands are the only CLI operations that touch the contributor submodule. They use Git directly and remain separate from `init`, `coreupdate`, `doctor`, and `skills`.

`docs/agents/` is canonical technical reference, currently preserved rather than exact-managed by the Core updater. A project override belongs in `.agents/project/AGENTS.md`; editing exact shared guidance creates a detectable upgrade conflict. See `agent-guidance.md` for routing and `cli-upgrades.md` for starter installation.

`docs/agents/` is developer-owned in consuming applications. The updater adds missing Markdown references but never overwrites existing product notes. Review and merge changed Core conventions deliberately. This is distinct from exact-managed `.agents/supacharger/guidance.md`.

`.supacharger/skills-lock.json` is CLI-generated metadata for skills installed through the Supacharger CLI. Do not edit it manually. Its inclusion in `developerOwnedPaths` means Core updates preserve the project’s installation record; it does not make the file developer-editable. Use the skills install/update commands to maintain it.

## Email template images

`public/images/email-template/` is developer-owned, Git-tracked branding copied on initial installation only. Replace `email-logo.png`, commit it and use its deployed absolute HTTPS URL in templates. Core updates neither overwrite nor add files here. See [Email templates](email-templates.md).

## Installation records

`docs/reports/sc-install/first-install-handhold-me.md` is developer-owned, supplied by the initial Core clone and preserved by updates. Initialise it in place and record verified progress. `docs/reports/sc-install/first-install-handhold-me-core.md` is the sibling Core CLI-managed **DO NOT EDIT** checklist reference, replaced on updates so developers can review the new installation procedure. Merge relevant changes into unfinished work deliberately; never replace completed evidence. Both files are committable and excluded from deployment.
