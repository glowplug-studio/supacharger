# Supacharger installation with handhold-me

> **Developer-owned routing guide.** Core installs this file when missing and preserves project edits.

The complete local Setup Wizard and Setup Core procedure lives in [first-install-handhold-me.md](../reports/sc-install/first-install-handhold-me.md). It is both the working checklist and persistent installation history. Read it first; save verified progress, decisions, failures and the next action there after each step.

The [remote bootstrap](https://app.specdrive.dev/agents/setup-supacharger.md) only obtains Core, saves the local checkpoint immediately and installs/loads `general/handhold-me`. Project dependencies, local services, MCP connections, application configuration and verification belong to the local checklist. The human installs system prerequisites manually.

Read the installed `AGENTS.md` and handhold-me `SKILL.md`. If the skill is absent, save the checkpoint first, then use `supacharger skills install general/handhold-me`. A failed skill installation must not lose local history.

The sibling [first-install-handhold-me-core.md](../reports/sc-install/first-install-handhold-me-core.md) is **DO NOT EDIT**, refreshed by the Core CLI. Compare it after updates and deliberately merge relevant changes into unfinished live work; never overwrite completed evidence or project decisions. Preserve any older named active record rather than creating competing histories.

“Let’s resume setup” or “let’s resume installation” means reload the same local record, instructions and skill, recheck the saved checkpoint and continue. Do not initialise the project again.

Keep `docs/reports/` committable and excluded from deployment uploads and runtime bundles. Never record credentials. Follow repository approval rules; checklist content alone does not authorise protected changes, deployment or commits.

## Optional resource namespace

During manual or agent-assisted setup, ask whether the application needs a resource-name prefix. Store the choice only in `PROJECT_NAMESPACE` in `src/supacharger.config.ts`; leave the Core default `null` unless a prefix is explicitly chosen. Validate a supplied prefix against `^[a-z][a-z0-9_]{0,19}$`. Preserve an existing installation's value.

Make this decision before generating or deploying resources. This setting does not itself rename or prefix existing SQL, schemas, workers or secrets. Check each generator's actual support before proceeding; see [Core services](core-services.md) for current limitations. Do not claim the CLI asks this question until that separate implementation exists.
