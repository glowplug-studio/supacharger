# Supacharger Core Agent Instructions

## Core-contract change approval gate

Before modifying any core-contracted file or behaviour, stop after inspection and ask the human owner to confirm that you should continue. First report the affected files and contracts, the consumers that must be synchronised, the proposed canonical result, and any migration, compatibility, deployment, or data risk. Do not make the change until the human explicitly says to continue or proceed.

Core-contracted scope includes protected or CLI-managed paths, `.supacharger/managed-files.json`, the `SupachargerConfig` contract, shared public APIs, authentication and route-protection behaviour, database schemas and migrations, exposed RPC signatures, generated database types, shared assets and file-ownership conventions, CLI installation/update behaviour, and the documentation that defines those contracts. Read-only inspection, comparison, diagnosis, and planning may continue before approval. Approval for one reported change set does not authorise newly discovered core-contract changes; report those separately and pause again.

## Mission

Develop `supacharger/` as the canonical, open-source starter core for applications built with Supacharger. Keep the core reusable, updateable by the Supacharger CLI, independently documented, and free of application-specific assumptions.

This repository is the canonical source of truth for shared Supacharger behaviour. Consuming applications may contain newer experiments or unique features, but they do not become authoritative until the human owner approves promotion into this core.

## Ownership model

Respect file ownership before making changes.

The version 2 manifest distinguishes four update modes. `managedPaths` are exact, byte-identical replacement files; `mergeManagedPaths` require contract-aware merging; `forwardOnlyMigrationPaths` accept only new migration files; and `developerOwnedPaths` are preserved. Never infer byte-replacement authority from a file being reusable Core code.

Keep protected contract tests limited to reusable Supacharger behaviour. Product-specific database, catalogue, table, RPC, or policy assertions belong in the developer-owned `test/project-billing-schema-contract.test.mjs` seam, with the consumer's merge-managed package script running both shared and project tests.

### CLI-managed core

Treat these directories as protected implementation owned by Supacharger and updated by the CLI:

- `src/supacharger/`
- `src/app/(supacharger)/`
- `src/lib/supabase/supacharger/`
- `.supacharger/` for CLI installation metadata

Application developers should consume these modules through their documented interfaces and should not edit them in place. A core maintainer may change them in this canonical repository.

### Developer-owned extension points

- `src/supacharger.config.ts` contains application settings and must survive every CLI update.
- `src/i18n/config.ts`, `src/i18n/request.ts`, and `messages/` contain the application's locale policy and translations. The CLI installs starters for a new application, preserves locale configuration and every secondary catalogue during updates, and may merge only missing or empty canonical English keys into `messages/en.json` without replacing existing application wording.
- `src/styles/project.css` contains application theme tokens, global defaults, overrides, and product-specific styles. Keep its `Project: ...` header accurate and preserve it during every CLI update.
- `src/components/sc_demo/` contains replaceable example presentation code.
- Application-specific routes, features, assets, and presentation outside protected paths belong to the consuming application unless explicitly designated as shared.

Keep product and account routes under `src/app/(project)/`. Keep the protected `src/app/(supacharger)/` tree limited to reusable framework routes and handlers. `package.json`, `package-lock.json`, `supabase/config.toml`, and `tailwind.config.ts` are merge-managed; `supabase/migrations/` is forward-only permanent history; `postcss.config.mjs` is exact managed.

`src/supacharger/supacharger-config.ts` is a protected compatibility interface that re-exports the developer configuration. Never move application values back into that protected module.

<!-- BEGIN:shared-svg-svgr-guidance -->

## UI SVGs and SVGR

- Store UI SVGs under an appropriate developer-owned `src/` path belonging to the feature or surface that owns them.
- Store demo-only SVGs under `src/components/sc_demo/` so removing the demo also removes its assets.
- Import UI SVGs as React components through SVGR. Use `public/` only when an asset genuinely needs a URL, such as metadata, a manifest, or an external integration contract.
- Keep every SVG responsive and preserve its aspect ratio. Every source SVG must have a valid `viewBox`.
- When CSS or Tailwind controls the rendered size, remove root-level intrinsic `width` and `height` attributes from the source SVG.
- Size SVG components at the call site with classes such as `size-*`, `w-*`, `h-*`, or `size-[1em]`. Usually add `shrink-0` when an SVG sits beside text.
- Do not force mismatched width and height values that distort the source aspect ratio. Do not fix clipping by adding arbitrary `width` or `height` props to the React component.
- Use `fill='currentColor'` or `stroke='currentColor'` only when the artwork is intended to inherit the surrounding text colour.
- Before changing an SVG component's sizing classes, inspect the rendered `<svg>` and confirm that SVGR/SVGO preserved its `viewBox`. For sizing such as `h-8 w-auto`, verify that the complete artwork stays inside the rendered bounds at every intended viewport size.
- Add a regression test asserting that responsive SVG assets retain their `viewBox` and omit root-level intrinsic dimensions. Visually verify SVG changes in the browser on every affected page.

A responsive source SVG root should look like:

```svg
<svg viewBox="0 0 323 46" ...>
```

Avoid root-level intrinsic dimensions when CSS controls sizing:

```svg
<svg width="323" height="46" viewBox="0 0 323 46" ...>
```

<!-- END:shared-svg-svgr-guidance -->

### Styling boundary

- `src/supacharger/styles/globals.css` is the single Tailwind entrypoint. It imports Tailwind once, then the shared core stylesheet, then the developer stylesheet.
- `src/supacharger/styles/supacharger.css` contains CLI-managed rules shared by every Supacharger application.
- `src/supacharger/styles/project.example.css` is a CLI-managed, unimported reference for the developer-owned stylesheet.
- Prefer Tailwind utilities in markup. Put custom element defaults in `@layer base`, semantic classes in `@layer components`, and narrowly scoped utilities in `@layer utilities`.
- Do not place product tokens, branding, or application-specific selectors in the CLI-managed styles, and do not import Tailwind again from `src/styles/project.css`.

Do not infer ownership solely from an import path. Protected modules currently consume some files outside protected directories; treat those dependencies as architecture to clarify, not permission for the CLI to overwrite every outside file.

## Shared-change workflow

When a task affects reusable behaviour:

1. Inspect the current core implementation and the corresponding implementations in the available consuming applications.
2. Report divergent behaviour, unique additions, incompatible assumptions, and migration risks.
3. Separate reusable core behaviour from application-specific customisation.
4. Recommend a canonical result, but do not silently resolve competing implementations when the human has not chosen one.
5. Land the approved shared implementation in this core first.
6. Update the Docusaurus documentation in `../supacharger-docs/` in the same change when that sibling repository is available. If it is unavailable, record the exact documentation follow-up required.
7. Propagate the approved interface to SnapScreen and Wakekeeper while preserving their developer-owned configuration and product behaviour.
8. Compare relevant non-visual contracts with Specdrive, but do not standardise its Untitled UI presentation layer unless explicitly requested.

## Open-source and licensing requirements

Do not copy or adapt licence-restricted Untitled UI source from Specdrive into Supacharger. Restricted implementations must be replaced with independently designed, clean-room code based on required behaviour, interaction states, and accessibility requirements. MIT-licensed material may be used only under its applicable terms and notices. Flag uncertain provenance before promotion.

SnapScreen is the approved visual and interaction basis for the shared authentication journey. Preserve its progressive provider-to-email transition, heading treatment, dark auth surfaces, branded actions, and matching password-reset presentation in Core, SnapScreen, and Wakekeeper. Keep project copy, colours, imagery, enabled methods, and adapters outside the protected implementation. Shared OTP and resend states must extend this presentation rather than replace it with a generic form. Specdrive retains its separate Untitled UI presentation.

## CLI compatibility

- Keep application settings outside CLI-managed directories.
- Preserve `src/styles/project.css` as a developer-owned extension point and install its starter only when the file is absent.
- Store CLI version and installation metadata in `.supacharger/core-lock.json`, never in application configuration.
- Treat overwrite safety, conflict detection, migrations, dependency changes, and removal of obsolete managed files as part of the public upgrade contract.
- Do not introduce a new developer-editable file inside a protected directory without first defining how CLI updates preserve it.
- When changing a protected interface, document the consumer migration and update the CLI in the same coordinated change when necessary.

## Canonical database foundation

- `app.profiles` is the single shared user-profile table. Its canonical reusable fields are `id`, `first_name`, `last_name`, `username`, `email`, `avatar_path`, `header_image_path`, `language_code`, `created_at`, and `updated_at`. Consumers may add product fields to this row or a one-to-one extension, but must not create a second shared user record.
- Auth insert and email-update triggers always create or synchronise the profile row. `POST_SIGN_IN_ONBOARDING.REQUIRED` controls routing only; it never disables profile creation. The shared completion contract always requires non-empty `first_name` and `last_name`, and requires `username` only when `PROFILE_IDENTITY.USERNAME` is `required`.
- `POST_SIGN_IN_ONBOARDING.REDIRECT_PATH` is developer-owned and must resolve to that application's setup flow. The callback and protected-route guard must both pass the configured username policy to `api.is_profile_complete_by_current_user(p_username_required)` rather than infer completion from session metadata.
- `PROFILE_IDENTITY.USERNAME` is `disabled`, `optional`, or `required`. Storage remains nullable and installed in every mode; forms, routes, and identity projections must obey the configured policy.
- Organisation tables and service adapters remain installed when `ORGANISATIONS.ENABLED` is false. Disabled applications must not expose organisation fields or invoke organisation context operations.
- Profile images live in the private `user-avatars` bucket. Store object paths, not public URLs: `<user-id>/avatar-<name>` for avatars and `<user-id>/headers/header-<name>` for headers. Render them through short-lived signed URLs.
- `process-image-upload` is the canonical authenticated image-resize boundary. Requests contain only `file` and a named `target`; bucket, destination path, output format, dimensions, and encoding settings come from developer-owned `supabase/functions/_shared/image-targets.ts`. Keep the transformer and endpoint CLI-managed, use the caller's RLS-scoped Storage client, and never introduce caller-supplied destinations or service-role uploads.
- `api.get_user_profiles_by_identifiers` is the general identity projection. It may return names, username, and media paths to verified authenticated users, but must never return email or unrestricted profile rows.
- Internal tables live in `app`; browser RPCs live in `api`; trusted service-only RPCs live in `api_edge`. Expose `api` and `api_edge` through PostgREST, not `app`.

## Mandatory English catalogue and translation policy

- Every task that adds or changes user-facing copy, introduces or changes a `useTranslations` or `getTranslations` call, or adds or changes a translation key must add or update the complete English source value in `messages/en.json` in the same change. This is required even when the human did not ask for translation work.
- Before reporting the task complete, verify that every referenced namespace and every statically referenced key exist in `messages/en.json` with non-empty English values. The consuming code and English catalogue are one atomic change; a task with missing English messages is incomplete and must not be reported as complete.
- Do not invent, machine-translate, copy English wording into, or otherwise fill any secondary-language value unless the human explicitly asks for translation into that specific language.
- When catalogue structure or validation requires corresponding keys in secondary catalogues, add those keys with empty strings as untranslated placeholders. Otherwise leave secondary catalogues unchanged.
- Treat empty secondary-language values as pending translation. Do not describe the affected language, catalogue, or surface as translated, complete, or reviewed.
- Run the project's English-catalogue or i18n validation command when one exists. The absence of an automated check does not waive the manual English namespace and key verification.
- Keep this entire policy verbatim in the workspace `AGENTS.md` and every project or nested `AGENTS.md`; do not shorten, paraphrase, or relocate it solely to another guidance file.

## Documentation and verification

- Keep code, `README.md`, repository agent guidance, MCP guidance, and `supacharger-docs` consistent with actual behaviour.
- Read `docs/agents/localisation.md` whenever adding or changing user-facing copy, locale behaviour, or translation catalogues.
- Read `docs/agents/input-validation.md` before creating or changing a form submission, Server Action, route handler, Supabase Edge Function request, or RPC input contract. Client validation is supplemental: parse every untrusted payload with Zod at its server-side JavaScript or TypeScript boundary, then preserve independent database constraints and authorisation.
- Interpret an unqualified request to "update the docs" as requiring the repository `README.md`, the Docusaurus documentation in `../supacharger-docs/`, and the agent-facing guidance/resources in `docs/agents/` and `tools/supacharger-mcp/` to be reviewed and updated together. Explicitly state when one of these surfaces is unaffected.
- Prefer focused checks during implementation and run the relevant lint, type, test, or build commands before reporting completion.
- Report all affected repositories and any verification that could not be run.
- Preserve unrelated worktree changes in this repository and every consuming application.
- Read `docs/agents/authentication-and-claims.md` before changing Proxy, SSR cookies, Auth Hooks, roles, custom claims, or JWT-based RLS. Preserve the one-verification response-state invariant and keep resource authorisation authoritative in current database state.

<!-- BEGIN:shared-bruno-rpc-guidance -->

## Bruno RPC maintenance

- Treat `docs/bruno/supacharger-rpc/` and `scripts/check-bruno-rpc-parity.mjs` as exact CLI-managed Core assets. Keep them byte-identical to the installed Core lock in every managed consumer.
- Add, update, rename, or remove the matching canonical Bruno request in the same change as every reusable client-callable `api` RPC contract change. Keep method, URL, schema headers, authentication, arguments, body, example, response expectations, status behaviour, and embedded documentation aligned.
- Run `npm run check:bruno-rpcs` before reporting an RPC or Core-alignment task complete. The Core check requires documentation for every current Core `api` RPC. In a consumer it requires every canonical Supacharger RPC while allowing additional product-owned RPCs.
- Keep consumer-specific RPC requests in the owning application's developer-managed Bruno collection and verification command. Do not add them to `docs/bruno/supacharger-rpc/` unless the RPC is first approved and implemented as a reusable Core contract.
- Never commit access tokens, service-role keys, secret keys, or customer data to a Bruno request or environment.
- The CLI must install the shared checker, collection, and missing required package script, run the declared parity check, and refuse to advance `.supacharger/core-lock.json` when parity fails.

<!-- END:shared-bruno-rpc-guidance -->

### PostgreSQL RPC argument naming

- Do not prefix PostgreSQL function or PostgREST RPC arguments with `p_` in exposed schemas. Use descriptive names and qualify columns and arguments anywhere they could be ambiguous.
- Rename existing arguments only with forward migrations. Preserve function behaviour, security attributes, ownership, comments, grants, and dependencies; update generated types, all callers, OpenAPI, and Bruno in the same change.
- Keep request bodies, schema profile headers, authentication requirements, examples, and explanatory docs aligned with the current migration and generated API contract.
- Do not add Specdrive, SnapScreen, Wakekeeper, or other consumer-specific endpoints to this collection. Promote a reusable contract into Supacharger first.
- Do not put real access tokens, service-role keys, secret keys, or customer data in Bruno files or environments. The default collection excludes privileged `api_edge` mutation workflows.

## Repository knowledge MCP

`tools/supacharger-mcp/` contains a read-only, repository-scoped MCP server for agent orientation. Its curated guidance lives in `docs/agents/`.

Keep the MCP descriptive rather than authoritative: `AGENTS.md` and the implementation remain the source of truth. Update MCP resources and ownership classification whenever the repository structure or principles change materially. Never add tools that expose secrets or mutate the repository without a separate, explicit design and approval.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
