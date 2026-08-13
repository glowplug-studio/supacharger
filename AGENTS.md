# Supacharger Core Agent Instructions

## Mission

Develop `supacharger/` as the canonical, open-source starter core for applications built with Supacharger. Keep the core reusable, updateable by the Supacharger CLI, independently documented, and free of application-specific assumptions.

This repository is the canonical source of truth for shared Supacharger behaviour. Consuming applications may contain newer experiments or unique features, but they do not become authoritative until the human owner approves promotion into this core.

## Ownership model

Respect file ownership before making changes.

### CLI-managed core

Treat these directories as protected implementation owned by Supacharger and updated by the CLI:

- `src/supacharger/`
- `src/app/(supacharger)/`
- `src/lib/supabase/supacharger/`
- `.supacharger/` for CLI installation metadata

Application developers should consume these modules through their documented interfaces and should not edit them in place. A core maintainer may change them in this canonical repository.

### Developer-owned extension points

- `src/supacharger.config.ts` contains application settings and must survive every CLI update.
- `src/i18n/config.ts`, `src/i18n/request.ts`, and `messages/` contain the application's locale policy and translations. The CLI installs starters for a new application but must preserve these paths during core updates.
- `src/styles/project.css` contains application theme tokens, global defaults, overrides, and product-specific styles. Keep its `Project: ...` header accurate and preserve it during every CLI update.
- `src/components/sc_demo/` contains replaceable example presentation code.
- Application-specific routes, features, assets, and presentation outside protected paths belong to the consuming application unless explicitly designated as shared.

`src/supacharger/supacharger-config.ts` is a protected compatibility interface that re-exports the developer configuration. Never move application values back into that protected module.

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

## CLI compatibility

- Keep application settings outside CLI-managed directories.
- Preserve `src/styles/project.css` as a developer-owned extension point and install its starter only when the file is absent.
- Store CLI version and installation metadata in `.supacharger/core-lock.json`, never in application configuration.
- Treat overwrite safety, conflict detection, migrations, dependency changes, and removal of obsolete managed files as part of the public upgrade contract.
- Do not introduce a new developer-editable file inside a protected directory without first defining how CLI updates preserve it.
- When changing a protected interface, document the consumer migration and update the CLI in the same coordinated change when necessary.

## Documentation and verification

- Keep code, `README.md`, repository agent guidance, MCP guidance, and `supacharger-docs` consistent with actual behaviour.
- Interpret an unqualified request to "update the docs" as requiring the repository `README.md`, the Docusaurus documentation in `../supacharger-docs/`, and the agent-facing guidance/resources in `docs/agents/` and `tools/supacharger-mcp/` to be reviewed and updated together. Explicitly state when one of these surfaces is unaffected.
- Prefer focused checks during implementation and run the relevant lint, type, test, or build commands before reporting completion.
- Report all affected repositories and any verification that could not be run.
- Preserve unrelated worktree changes in this repository and every consuming application.

## Repository knowledge MCP

`tools/supacharger-mcp/` contains a read-only, repository-scoped MCP server for agent orientation. Its curated guidance lives in `docs/agents/`.

Keep the MCP descriptive rather than authoritative: `AGENTS.md` and the implementation remain the source of truth. Update MCP resources and ownership classification whenever the repository structure or principles change materially. Never add tools that expose secrets or mutate the repository without a separate, explicit design and approval.
