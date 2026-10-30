# Agent guidance and technical references

`AGENTS.md` is the entry point. It explicitly loads shared `.agents/supacharger/guidance.md`, developer-owned `docs/agents/project.md`, and the optional `.agents/supacharger/core-development/AGENTS.md` when installed. Normal CLI use ignores the optional contributor path; Core contributors explicitly run `supacharger coredev install` or `supacharger coredev update`. The project file routes UI work to project-owned rules and can be extended with repository-specific instructions.

`docs/agents/` explains how to develop with Supacharger. Keep development conventions and architecture here; keep project working rules in `project.md` and linked `project/` topics. The repository-knowledge MCP exposes these same files, not a separately maintained copy. Its `agent_guidance` and `working_rules` topics explain orientation and instruction ownership.

## Project UI and icon rules

Read `docs/agents/project/ui-implementation.md` for the application's UI conventions and `docs/agents/project/icon-usage.md` for its approved concept-to-icon mappings. These are developer-owned files, linked from `docs/agents/project.md`; Core updates must preserve local choices. Keep mapping examples explicitly non-binding. The repository MCP exposes `ui_implementation` and `icon_usage` for its own checkout; when working on a consumer, read that consumer's local files rather than treating Core's starter as its visual policy.

## Guidance placement

Root `AGENTS.md` contains entry-point links only. Follow [Where to record instructions](../../.agents/supacharger/guidance.md#where-to-record-instructions) before adding agent guidance; edit the owning topic rather than expanding the root file. `.agents/project/AGENTS.md` is a compatibility routing pointer. Existing task procedures and skills remain under `.agents/instructions/` and `.agents/skills/`; read them when relevant.

## Read by task

- Before editing installed extension files, read [Extension file ownership](extensions.md#file-ownership-contract) and the installed consumer guide. Private extension-development instructions are for the Supacharger Core team, not consumer developers.

- Before changing any database definition or migration, read [Declarative database definitions](declarative-database.md), especially protected Core contracts and project-specific upgrade histories.

- Before developing extension database operations, read [Database service registrations](core-services.md#developing-extensions-with-database-operations).
- Before changing Next.js code, read the framework guidance in [project.md](project.md#framework-guidance).

- Read [Database and resource namespaces](database-namespaces.md) before creating tables, schemas, buckets, workers or secrets.

- Read [Core services](core-services.md) for auth and transactional email provider selection, and before naming new resources. Read `PROJECT_NAMESPACE` from `src/supacharger.config.ts`; do not infer a prefix from branding or the Supabase project reference.

- Read the project-editable [installation.md](installation.md) and immutable [Core installation reference](../reports/sc-install/first-install-handhold-me-core.md) when using handhold-me for installation or setup.

- Start with `project-overview.md` and `ownership.md` for architecture and file ownership.
- Read `cli-upgrades.md` for installed Core updates and `extensions.md` for optional application modules.
- Read `authentication-and-claims.md`, `account-settings.md`, `profile-extensions.md` and `organisation-settings.md` for identity and account work.
- Read `input-validation.md`, `database-foundation.md` and `billing.md` for request, database and billing contracts.
- Read `localisation.md` for English source messages and translation policy.
- Read `project-widgets.md`, `loading-ui.md` and `image-transformation.md` for reusable media and UI conventions.
- Read `svg-guidance.md` before changing UI SVG assets, imports or sizing.

For email HTML, public logo ownership and copyable Supabase/Brevo sources, read [Email templates](email-templates.md).

## Working rules and public references

Follow [Skills and changelog ownership](../../.agents/supacharger/guidance.md#skills-and-changelog-ownership) for installation, updates, generated records and release-note authority. Core contributor tooling remains local; consumer projects may commit their selected skills and records. The CLI removes Core-only skill ignore rules when creating an application.

Follow [Technical references and MCP](../../.agents/supacharger/guidance.md#technical-references-and-mcp) for online documentation and read-only repository knowledge, and [Existing technical references](../../.agents/supacharger/guidance.md#existing-technical-references) when reviewing preserved application guidance.

Before creating or editing reports, audits, investigations, plans or handoffs, including `.agents/` records, read [reporting.md](reporting.md).

See [Agent guidance](https://supacharger.dev/docs/agents) and [Contributing](https://supacharger.dev/docs/contributing) for public orientation and contributor setup.

## Installed extension instructions

When a task concerns an installed extension, read `docs/agents/extensions/<registry-name>/AGENTS.md` if present. Check the actual installed version and enabled state; do not load every extension guide or require Brevo globally. The local CLI supports this mapping; older installations may not have this directory. Follow their actual installed INSTALL.md instead.
