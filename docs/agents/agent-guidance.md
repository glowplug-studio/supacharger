# Agent guidance and technical references

`AGENTS.md` is the entry point. It explicitly loads shared `.agents/supacharger/guidance.md`, developer-owned `.agents/project/AGENTS.md`, and the optional `.agents/supacharger/core-development/AGENTS.md` when installed. Normal CLI use ignores the optional contributor path; Core contributors explicitly run `supacharger coredev install` or `supacharger coredev update`. The project file starts blank. `.agents/legacy/original-agents.md` is inactive historical material, not an additional source of active rules.

`docs/agents/` explains how to develop with Supacharger. Keep development conventions and architecture here; keep repository working rules in `.agents/`. The repository-knowledge MCP exposes these same files, not a separately maintained copy. Its `agent_guidance` and `working_rules` topics explain orientation and instruction ownership.

## Read by task

- Start with `project-overview.md` and `ownership.md` for architecture and file ownership.
- Read `cli-upgrades.md` for installed Core updates and `extensions.md` for optional application modules.
- Read `authentication-and-claims.md`, `account-settings.md` and `organisation-settings.md` for identity and account work.
- Read `input-validation.md`, `database-foundation.md` and `billing.md` for request, database and billing contracts.
- Read `localisation.md` for English source messages and translation policy.
- Read `project-widgets.md`, `loading-ui.md` and `image-transformation.md` for reusable media and UI conventions.

## Free public skills

`supacharger skills install` presents a checkbox catalogue from the public Glowplug skills repository. `supacharger skills install general/changelog` installs one named skill. The complete skill folder goes under `.agents/skills/changelog/`; source commits and file hashes go in `.supacharger/skills-lock.json`. Existing files and local edits are preserved. `supacharger skills update [ids...]` explicitly updates unchanged tracked installations; it does not advance the Core lock or install paid modules.

`CHANGELOG.project.md` is application-owned. `CHANGELOG.md` records Core history and requires a human request to update Core release notes or commit Core changes. The optional contributor policy delegates writing to the general changelog skill. Installing that skill does not activate Core contributor obligations.

See [Agent guidance](https://supacharger.dev/docs/agents) and [Contributing](https://supacharger.dev/docs/contributing) for the structure and setup instructions.

Installed skills and their records are ignored in the upstream Core repository. The public catalogue owns reusable skill source. Applications may commit their own selected installations and generated records; records protect local edits and do not restrict which skills may be installed. The CLI removes Core-only skill ignore rules when creating an application.
