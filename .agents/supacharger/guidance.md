# Working with Supacharger guidance

The root `AGENTS.md` explicitly loads this guidance and `.agents/project/AGENTS.md`. The project directory is a Supacharger convention, not an assumption about automatic agent discovery.

## Protected-contract change approval gates

Before modifying any protected contract, file, or behaviour, inspect the relevant `.supacharger/managed-files.json`, `.supacharger/core-lock.json`, and repository ownership rules, then classify the change under exactly one of the following gates. Stop after inspection and ask the human owner to confirm that you should continue. First report the affected files and contracts, their ownership classification, the proposed result, and any migration, compatibility, deployment, or data risk. The report must explicitly state whether Supacharger Core is affected and whether any other consumer must be synchronised. Do not make the change until the human explicitly says to continue or proceed. Read-only inspection, comparison, diagnosis, and planning may continue before approval. Approval for one reported change set does not authorise newly discovered protected-contract changes; report those separately and pause again.

### Project core gate

Use the project core gate when a change affects only one application's protected, project-owned contracts. Examples include project-owned database schemas and forward-only migrations, product RPC or API signatures, generated product database types, project authentication or route-protection rules, and project API or Bruno documentation. The approval report must say that Supacharger Core is unaffected and that no other consumer requires synchronisation. A project-specific database, migration, or RPC change is not a Supacharger Core change merely because it uses Supacharger conventions or lives under `forwardOnlyMigrationPaths` or `developerOwnedPaths`. Exact `managedPaths` and shared merge-managed requirements remain under the Supacharger Core gate.

### Supacharger Core gate

Every approval alert for a Supacharger Core change must start with the exact prefix `🚧🚨 Supacharger Core Change Protection: `. This includes proposed edits to Core CLI-managed files. Do not use this prefix for project-only approval requests.

Use the Supacharger Core gate only when a change affects the canonical `supacharger/` repository or a shared Supacharger contract that must be synchronised across consumers. This includes CLI-managed files and `managedPaths`, merge-managed contract requirements, `.supacharger/managed-files.json`, the canonical `SupachargerConfig` property names and value shapes, shared public APIs, shared authentication and route-protection behaviour, shared assets and file-ownership conventions, CLI installation or update behaviour, and canonical Supacharger Core documentation. The approval report must identify every affected consumer and the required synchronisation. Database schemas, migrations, RPCs, generated types, authentication rules, and API documentation fall under this gate only when they define or change shared Supacharger Core behaviour.

### Application-owned changes

A requested change to an ordinary application value in `src/supacharger.config.ts` does not trigger either gate when the complete canonical property set, names, types, nesting and shared meanings remain unchanged. Security-sensitive values require the project core gate, including authentication and session policy, authorisation, public or protected route exposure, privileged access, native association identifiers and billing-access enforcement. Changes to Core defaults or a canonical property's presence, name, type, nesting or shared meaning require the Supacharger Core gate.

Ordinary product code, UI and documentation that do not define a protected contract do not trigger either gate. Preserve the application's dedicated security and privileged-boundary rules. Report the resulting behaviour and verification without describing a project-only change as a Core change.

## Where to record instructions

When a human says "put this in AGENTS.md" without naming a file, place repository-specific working rules in `.agents/project/AGENTS.md`. Rewrite rough notes clearly without broadening their scope. Honour an explicitly named destination.

Keep reusable Supacharger development conventions and technical explanations in `docs/agents/`, starting with `docs/agents/agent-guidance.md`. Keep optional Core contributor policies in `.agents/supacharger/core-development/`. Put reusable task procedures in skills, each with its own `SKILL.md`. Do not duplicate technical references across these locations.

Project instructions may override this shared guidance for the application, subject to the human's instructions and applicable higher-priority rules. Prefer recording overrides in the project file. Editing this shared file creates upstream drift; the Core updater must report the conflict rather than silently replace it.

## Technical references and MCP

Read `docs/agents/agent-guidance.md` and the references relevant to the task before changing Supacharger behaviour. The read-only repository-knowledge MCP exposes those same files for orientation and search. References explain the implementation; they do not grant permission for commits, deployment or protected changes.

## Skills and changelog ownership

Skills installed in `.agents/skills/` are preserved during Core updates. Use `supacharger skills install` to select free public Glowplug skills, or `supacharger skills install general/changelog` for a named installation. Updating an installed skill requires an explicit `supacharger skills update` request. `.supacharger/skills-lock.json` is generated only for skills installed through this CLI; developers and agents must not edit it manually. Never treat a general skill as permission to modify Core history.

`CHANGELOG.project.md` records application changes. `CHANGELOG.md` belongs to Core contributors: only a human request to update Core release notes or commit Core changes authorises agent edits. Ordinary application commits do not. Installing an upstream Core version may copy its published changelog unchanged; this is not authoring new entries. Follow the optional contributor instructions when working on Core; do not require application developers to install them.

## Existing technical references

`docs/agents/` is developer-owned in applications. Core updates install missing references and preserve existing files; review changed upstream conventions and merge them deliberately, keeping product details accurate. A reference to a newer Core feature does not establish that the installed application implements it.
