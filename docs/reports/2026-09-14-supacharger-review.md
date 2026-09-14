# Supacharger setup and Core distribution review

Status: **CLI 1.1.0 release candidate verified — npm publication pending**

Last updated: 2026-09-14

## Intended outcome

Finish the current Supacharger setup, documentation and distribution work with one durable record that another agent can resume without reconstructing the conversation. Confirm that Core-owned behaviour is distributable through the CLI, project-owned changes are preserved, setup can be paused safely, and remaining compatibility risks are explicit.

## Scope

Included:

- email-template distribution and related Core/consumer ownership;
- shared password reset and password-setting behaviour;
- the CLI ownership and update contract;
- guidance preventing unsolicited CLI regression tests during Core or consumer work;
- three documented setup routes: manual Git, CLI and agent-assisted MCP;
- `handhold-me` installation, persistent setup checklists and resuming later;
- editable and Core-managed installation guidance;
- Core change protection routing; and
- a breaking-change review skill.

Excluded until separately authorised:

- publishing the CLI or documentation site;
- applying hosted database migrations or changing production services;
- adding CLI regression tests.

## Confirmed facts and decisions

- [x] **CLI regression-test policy recorded.** Core and consumer work must not create or extend CLI regression tests unless the human explicitly requests them. Evidence: `.agents/supacharger/guidance.md`.
- [x] **Password reset aligned in Core and consumers.** Today’s Core history includes the reset form alignment and follow-up password-reuse explanation. SnapScreen, Specdrive and Wakekeeper each contain corresponding reset-form and password-reuse commits. Evidence: Core commits `f5af049` and `9d9971a`; consumer histories inspected on 2026-09-14.
- [x] **Setup routes documented.** The documentation Getting Started page now presents Manual Git, CLI and MCP routes; the manual guide is labelled accordingly and agentic material is grouped in the Agentic Development section. Evidence: current `supacharger-docs` worktree and successful local documentation build.
- [x] **Pause and resume behaviour defined.** First setup tells the developer they can return and say “let’s resume setup” or “let’s resume installation”. Progress is stored in a task checklist and verified against current state on return. Evidence: `docs/agents/installation.md` and `.agents/supacharger/guidance.md`.
- [x] **Public setup prompt published.** The version 3 bootstrap payload is live at `https://app.specdrive.dev/agents/setup-supacharger.md`. It verifies the manually installed CLI, obtains Core, creates the live checklist and loads `handhold-me` before handing over to installed guidance.
- [x] **Installation guidance ownership split defined.** `docs/agents/installation.md` is installed once and remains developer-editable. `docs/reports/sc-install/first-install-handhold-me-core.md` is Core-managed and must not be edited in a consuming application.
- [x] **Setup version policy decided.** Installation guidance uses `@glowplug/supacharger-cli@latest`; `init` obtains the current Core selected by that CLI. Fixed minimum CLI or Core versions are not maintained in the setup instructions.

## CLI audit findings

- [x] **Publish target selected.** CLI commit `be5e782` is the 1.1.0 release candidate and contains its release notes. npm `latest` remains 1.0.4 until publication.
- [x] **Initialisation failure recovery protected.** `init` downloads and prepares Core in a sibling transaction directory, touches the target only after preparation succeeds, preserves `.git`, and restores the original target contents after installation failure.
- [x] **Configuration inspection corrected.** `doctor` uses the TypeScript parser, compares exact nested configuration paths, and fails clearly when object structure cannot be resolved.
- [x] **New-path collisions blocked.** Planning reports an incoming managed path that collides with an unrelated project file; a real update stops before overwriting it.
- [x] **Update recovery defined.** The Core lock is not advanced after failure. Recovery uses the Git diff and locally excluded `.supacharger/backups/`; applied database migrations remain forward-only.
- [x] **Skip semantics removed.** A managed-file conflict can be overwritten after recovery copies are created or the update can exit. Partial skip no longer presents a state that exact verification cannot accept.
- [x] **Merge-managed limits enforced.** The README names the supported package and Supabase merges. Incoming non-test script changes, lockfile-only changes, unsupported Supabase configuration and other unimplemented merge-managed changes stop with the affected file named.
- [x] **Keep extensions out of deployment.** Extension installers remain explicitly sidelined from the npm CLI release until their separate workflow is implemented and verified. Evidence: CLI `TODO.extensions.md` and package guidance.

## Installation and resumption checkpoints

- [x] Create an editable installation guide and sample task checklist.
- [x] Add an immutable Core-managed installation reference with a do-not-edit notice.
- [x] Classify the editable guide as developer-owned and the reference as managed in `.supacharger/managed-files.json`.
- [x] Require an agent to compare the previous and installed Core reference when Core changes during an active installation.
- [ ] Verify the public setup prompt from a clean project with the released CLI version. Owner: human and agent. Evidence: completed task checklist and clean verification output.

## Core protection and compatibility review

The current protection system has three distinct responsibilities:

| Responsibility | Current source | Limit |
|---|---|---|
| File ownership and update mode | `.supacharger/managed-files.json` | Does not identify semantic breakage |
| Installed Core baseline | `.supacharger/core-lock.json` in consuming applications | Records a revision, not compatibility |
| Agent approval routing | `.agents/supacharger/guidance.md` | Depends on the agent identifying affected contracts |

Runtime authentication and route protection remain application/Core configuration and code concerns; `.supacharger/` metadata does not enforce runtime access.

### Breaking-change review skill

- [x] Define a `core-upgrade-review` skill that compares the installed Core revision with a proposed immutable revision.
- [x] Inspect actual diffs and commit history for exports, configuration shapes, environment variables, routes, RPCs, database contracts, adapters and deployment assumptions.
- [x] Search developer-owned consumer code for affected usage.
- [x] Classify findings as confirmed breakage, likely incompatibility, compatible change or insufficient evidence.
- [x] Report affected files and symbols, required consumer changes, migration/deployment order, verification and recovery.
- [x] Invoke the existing project/Core protection gate rather than defining a second approval system.
- [x] Keep static analysis claims bounded: the skill cannot guarantee detection of every behavioural break.

## Decisions still required

- Publish CLI 1.1.0 from commit `be5e782` after authenticating to npm, then verify a clean install through `@latest`.
- Review and refine the first version of the `core-upgrade-review` skill in the public Glowplug skills repository.

## Current checkpoint

The documentation, ownership model, public bootstrap and CLI 1.1.0 release candidate are verified. `npm run check` passes all 71 existing tests, the package dry run contains 15 intended files and no test directory, initialisation succeeds from the private Core repository, and `doctor` plus `coreupdate --plan` pass against an installed consumer and the current local Core. The remaining checkpoint is npm publication followed by a clean public `@latest` setup.
