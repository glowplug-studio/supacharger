# Working with Supacharger guidance

The root `AGENTS.md` explicitly loads this guidance and `.agents/project/AGENTS.md`. The project directory is a Supacharger convention, not an assumption about automatic agent discovery.

## Where to record instructions

When a human says "put this in AGENTS.md" without naming a file, place repository-specific working rules in `.agents/project/AGENTS.md`. Rewrite rough notes clearly without broadening their scope. Honour an explicitly named destination.

Keep reusable Supacharger development conventions and technical explanations in `docs/agents/`, starting with `docs/agents/agent-guidance.md`. Keep optional Core contributor policies in `.agents/supacharger/core-development/`. Put reusable task procedures in skills, each with its own `SKILL.md`. Do not duplicate technical references across these locations.

Project instructions may override this shared guidance for the application, subject to the human's instructions and applicable higher-priority rules. Prefer recording overrides in the project file. Editing this shared file creates upstream drift; the Core updater must report the conflict rather than silently replace it.

## Technical references and MCP

Read `docs/agents/agent-guidance.md` and the references relevant to the task before changing Supacharger behaviour. The read-only repository-knowledge MCP exposes those same files for orientation and search. References explain the implementation; they do not grant permission for commits, deployment or protected changes.

## Skills and changelog ownership

Skills installed in `.agents/skills/` are preserved during Core updates. Use `supacharger skills install` to select free public Glowplug skills, or `supacharger skills install general/changelog` for a named installation. Updating an installed skill requires an explicit `supacharger skills update` request. Never treat a general skill as permission to modify Core history.

`CHANGELOG.project.md` records application changes. `CHANGELOG.md` belongs to Core contributors: only a human request to update Core release notes or commit Core changes authorises agent edits. Ordinary application commits do not. Installing an upstream Core version may copy its published changelog unchanged; this is not authoring new entries. Follow the optional contributor instructions when working on Core; do not require application developers to install them.

## Existing technical references

`docs/agents/` is developer-owned in applications. Core updates install missing references and preserve existing files; review changed upstream conventions and merge them deliberately, keeping product details accurate. A reference to a newer Core feature does not establish that the installed application implements it.
