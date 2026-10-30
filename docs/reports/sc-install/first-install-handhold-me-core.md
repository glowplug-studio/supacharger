# First install — Core checklist reference

Created: unknown — not previously recorded
Last edited: 2026-10-30T17:32:59+07:00 (Asia/Bangkok)

> **DO NOT EDIT — Core CLI-managed.** This is the upstream procedure shipped with the installed Core version. Updates replace it. Execute and record progress in the developer-owned sibling `first-install-handhold-me.md`, which updates preserve. Never mark this reference complete in a consumer.

## Bootstrap boundary

The remote payload only verifies the tools needed to obtain Core, obtains the application, saves a local checkpoint immediately and installs/loads handhold-me. The local checklist owns everything below, including project dependencies, remaining wizard work and Setup Core. If bootstrap stops before the skill is available, its local checkpoint still preserves the history.

## Local Setup Wizard

Use the installed handhold-me skill and repository instructions. Save each result in the live record before starting the next step. If a command fails, save the failure and next action before troubleshooting or asking for help. Mark completion only after verification.

- [ ] **Bootstrap handover.** Record the target, route, verified tools, Core/CLI versions and any earlier checkpoint immediately. Read `AGENTS.md` and `docs/agents/installation.md`. If bootstrap stopped before handhold-me was ready, save that state, run `supacharger skills install general/handhold-me` and read its installed `SKILL.md`. Preserve an older named active record instead of creating competing histories.
- [ ] **Remaining prerequisites.** Check the versions declared by `package.json` and verify local development tools, including Docker. The human installs or upgrades Git, Node.js/npm, Docker, the Supacharger CLI and other system tools manually. Report missing prerequisites and pause dependent work.
- [ ] **Application dependencies.** Read the installed package manager, lockfile and declared scripts. Install project dependencies using the supported command, currently `npm install`. Preserve existing configuration and use the project-pinned Supabase CLI through `npx`.
- [ ] **Namespace and fresh database.** Confirm `PROJECT_NAMESPACE` in `src/supacharger.config.ts`: an empty value uses `sc_`; an optional 1–6 character code adds that project code. CLI initialisation prepares the desired definitions, local Supabase configuration and one initial migration automatically; non-interactive installs accept `--namespace <code>` and default to the empty value. For a manual fresh download only, run `node src/supacharger/database-starter.cjs --fresh` after dependencies and before linking or starting Supabase. Verify the resulting names. On resume, preserve the chosen namespace and existing history; never rerun fresh preparation against an installed application.
- [ ] **Skills and guidance.** Offer other relevant skills and install selected ones. Read local Supacharger references directly or through its read-only MCP. Missing MCP access does not prevent reading installed files.
- [ ] **Local services and connections.** With Docker running, start local Supabase using the installed project's command, normally `npx supabase start`. Verify service status without exposing credentials. Configure selected project-scoped MCP connections for the intended development environment; reuse existing connections and provide OAuth links for the human to open. Never reset existing databases by default.

## Setup Core — local configuration

- [ ] **Origin and environment.** Choose the preferred available port and consistent hostname. Align application and callback URLs. Prepare missing local environment values from the installed example and service state, preserving existing values. Record variable names, never secrets.
- [ ] **Database and identity.** Verify database readiness, required migrations and type generation using installed procedures. Configure site title, description, branding, metadata, language and appearance.
- [ ] **Authentication and routing.** Configure selected sign-in/up methods, redirects and public/protected routes against the installed configuration contract. Follow the project's protected-change approval rules.
- [ ] **Profiles and organisations.** Record and apply the chosen profile, onboarding, account and organisation policies.
- [ ] **Optional choices.** Review billing, providers, mobile links, analytics, licence information, extensions and Specdrive once. Record selected or deferred choices. Defer Vercel CLI/MCP and hosted connections until hosting is selected; the human installs any missing system tools. Do not make optional purchases prerequisites.
- [ ] **Verification.** Run relevant declared checks and one build, start the application and verify the selected local authentication journey. Record actual application/service URLs and evidence. Repeat a successful build only if a change or failure warrants it.
- [ ] **Handover.** Record completed work, deferred options, blockers and next action. A connected service does not prove the application is configured. Hosted database operations, deployment and Git commits require their own authorisation.

## Saving and resuming

Save the environment, decisions, evidence, approval scope, blockers, next action, owner and timestamp in the live record after each verified step and before a pause or tangent. Save failures even if the skill or a service is not yet available.

“Let’s resume setup” or “let’s resume installation” means read the live record first, reload installed instructions and handhold-me, recheck the next step's prerequisites and continue unfinished work. Do not repeat initialisation or reset configuration. On a Core update, compare the old and new `first-install-handhold-me-core.md` and deliberately merge relevant procedure changes into unfinished work, preserving decisions and evidence. Record any comparison limitation if the earlier revision is unavailable.

Use https://supacharger.dev/llms.txt for individual documentation links or https://supacharger.dev/llms-full.txt for complete Markdown documentation when needed. Verify live-site guidance against the installed Core revision.

## Required record fields

The live record retains installation identity, environment, route, Core/CLI versions, skill location, scope, decisions, verification evidence, approvals, blockers, next action, owner and timestamp. Never store credentials. Keep reports committable and excluded from deployment uploads and runtime bundles. This reference supplies procedure, never authorisation.
