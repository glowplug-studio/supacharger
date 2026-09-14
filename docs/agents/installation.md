# Supacharger installation with handhold-me

> **Project-editable guide.** Core installs this file only when it is missing. The CLI preserves later project edits. Compare it with [the Core-managed installation reference](../reports/sc-install/first-install-handhold-me-core.md) after a Core update, then deliberately merge relevant changes here and into the active checklist.

Use the `handhold-me` skill to turn an installation or setup discussion into a checklist, then work through approved steps with verification. Read the installed skill’s `SKILL.md` before using it. If needed, install it from the project root with:

```bash
supacharger skills install general/handhold-me
```

## Checklist location

Use [first-install-handhold-me.md](../reports/sc-install/first-install-handhold-me.md) as the live first-install checklist at `docs/reports/sc-install/first-install-handhold-me.md`. Initialise it in place; do not copy it to a task-named file. Keep using the same file as the task progresses. Preserve an older named active checklist if one already exists.

State the intended outcome, scope, prerequisites, owner of each step and how completion will be checked. Keep unverified items unchecked. When a step needs human input, preserve the current checkpoint and give the human one bounded action at a time.

## Setup Wizard → Setup Core

The human installs Git, Node.js, npm, Docker and the Supacharger CLI manually using https://supacharger.dev/docs/guides/prerequisites. Agents verify these prerequisites; they must not install or upgrade the system tools. Missing prerequisites return the human to that guide.

Before the application exists, https://app.specdrive.dev/agents/setup-supacharger.md supplies the self-contained Setup Wizard procedure. Do not require AGENTS.md, Core references, a skill or an MCP connection before they are installed. Keep any pre-install checkpoint outside the empty installation target and tell the human its location for resuming.

After obtaining Core, read the installed AGENTS.md, this installation guide and the Core installation reference. Install and read `general/handhold-me` through the supported CLI workflow. Initialise `docs/reports/sc-install/first-install-handhold-me.md` in place and import verified wizard evidence, decisions and blockers. Never overwrite an active record. Preserve an existing older named installation checklist and continue it; do not create competing records or rename history silently.

Use these checkpoints for both agent and manual installation:

1. **Wizard — prerequisites:** verify manually installed tools and repository access.
2. **Wizard — application:** obtain Core in the empty target, install application dependencies, record Core and CLI versions, load guidance and selected skills.
3. **Wizard — services and handover:** prepare local services, configure relevant project-scoped MCP connections, provide OAuth links for the human to open, and transfer progress into the live checklist. Hosted tooling is deferred until that environment is selected.
4. **Core — origin and environment:** choose a port and consistent hostname; align application and callback URLs; prepare missing environment values from the installed example without exposing secrets.
5. **Core — database and identity:** verify local database readiness, generate types where required, and configure site identity, metadata, language and appearance.
6. **Core — application policy:** configure authentication, public/protected routing, redirects, profiles, account onboarding and organisations using the installed configuration contract and applicable approval rules.
7. **Core — optional choices:** review billing, providers, mobile links, analytics, licence information, extensions and Specdrive once; record selected or deferred items.
8. **Core — verification:** run relevant declared checks and one build, start the application, verify the selected local authentication journey and record URLs and unresolved work. Do not repeat a successful build without a change or failure that warrants it.

Continue to hosted setup only when the human selects that environment. A connected MCP service does not prove application or hosted configuration is complete.

## First setup and returning later

At the first checkpoint, tell the developer:

> You can pause and return to this project in the same or a new chat. Say “let’s resume setup” or “let’s resume installation” and I’ll read the saved checklist, check what is still valid and continue from the next unfinished step.

Initialise `first-install-handhold-me.md` in place without overwriting existing progress. Record the project, environment, installation route, Core/CLI versions where available, skill location, evidence, decisions, blockers, approvals with their exact scope, and the next action and owner. Save the checkpoint and last-updated time after every verified step and before a pause or tangent.

When the developer asks to resume setup or installation:

1. Read the repository entry point, this guide and `.agents/skills/handhold-me/SKILL.md`. If the skill is missing, use the supported installation workflow; preserve customised installations.
2. Find the existing task checklist in `docs/reports/sc-install/`. Ignore untouched legacy samples; an uninitialised first-install record is available to initialise, not evidence of completed setup. Use the named installation or single active match; ask if several could match. If none exists, reconstruct an unchecked checklist from inspected evidence rather than inventing progress.
3. Read its environment, decisions, evidence, approvals, blockers and checkpoint. Inspect Git status and the selected project before changing anything.
4. If Core changed since the last checkpoint, compare `docs/reports/sc-install/first-install-handhold-me-core.md` between the checklist's recorded Core revision and the installed revision. Review relevant changes against this editable guide and the unfinished checklist. Record adopted guidance, inapplicable changes and any new decision or approval needed; do not replace project decisions silently.
5. Recheck relevant state that may have changed: running services, tool versions, environment-variable presence without values, selected local/hosted project and prerequisites for the next step. Use read-only checks. Preserve historical evidence and mark changed or uncertain conditions for re-verification.
6. Briefly report where setup stopped, what remains valid and the next action. Continue within the recorded authorised scope. Do not repeat cloning, overwrite configuration, reset databases or apply hosted migrations merely because setup resumed. Obtain approval for a different environment or newly protected operation.
7. Update the same checklist as work continues. A new chat must be able to resume from the files without access to the previous conversation.

## Core updates during installation

`docs/reports/sc-install/first-install-handhold-me-core.md` is the immutable upstream procedure and is replaced by the CLI with each Core version. Do not edit that file in an application. Keep project-specific decisions and progress in this guide and the task checklist.

Before updating Core during an active installation, save the current Core revision, reference-file hash and checkpoint in the checklist. After updating, compare the old and new Core-managed reference through the application's Git diff or the canonical Core revisions. Assess only changes relevant to unfinished work and record the result before resuming. If the earlier content is unavailable, record that limitation and compare the installed reference with the editable guide instead of claiming a complete change review. A changed reference does not invalidate completed evidence automatically and does not authorise new protected operations.

## Git and deployment

The checklist and other files under `docs/reports/` may be committed for the team. `.vercelignore` excludes this directory from Vercel uploads, and the project’s Next.js configuration excludes it from traced server bundles. Keep reports outside `public/` and do not import or copy them into application output.

Record credential names and required permissions, never credential values, tokens or private customer data. Planning does not authorise implementation, deployment or a Git commit; follow the project’s approval rules.
