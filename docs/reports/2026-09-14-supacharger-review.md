# Supacharger setup and Core distribution review

Status: **In progress — documentation and bootstrap checkpoint verified**

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

## CLI audit findings to resolve or accept

- [ ] **Confirm the publish target.** The inspected local CLI source is newer than the currently published npm package. Before deployment, select the intended source commit, version and release notes. Owner: human and CLI maintainer. Evidence required: chosen immutable commit and package version.
- [ ] **Protect initialisation failure recovery.** Current initialisation can remove its target before a download succeeds. Decide and implement a staging/atomic replacement strategy before treating installation as failure-safe. Owner: CLI maintainer.
- [ ] **Correct configuration inspection.** `doctor` uses a flattened regex-based TypeScript configuration parser and can misreport nested or wildcard values. Replace or constrain this inspection before relying on it as authoritative compatibility evidence. Owner: CLI maintainer.
- [ ] **Handle new-path collisions.** Confirm that an incoming Core-managed path cannot silently replace an unrelated developer file that did not exist in the installed baseline. Owner: CLI maintainer.
- [ ] **Define update recovery.** The updater does not provide a complete transaction rollback for every partial failure. Document recovery or implement atomic update staging. Owner: CLI maintainer.
- [ ] **Clarify skip semantics.** A skipped missing or modified managed file may subsequently fail exact verification. Align prompts, actions and verification outcome. Owner: CLI maintainer.
- [ ] **Review merge-managed limits.** `package.json`, `package-lock.json` and `supabase/config.toml` use known merge/migration logic rather than a generic semantic merge. Document supported changes and report unsupported upstream changes clearly. Owner: CLI maintainer.
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

- Whether to address the CLI audit findings before the next npm release or publish the current supported subset with explicit limitations.
- Review and refine the first version of the `core-upgrade-review` skill in the public Glowplug skills repository.

## Current checkpoint

The documentation, ownership model and public bootstrap are verified. The next proposed engineering checkpoint is to choose which CLI audit findings block release, then test the public setup flow from a clean project using the released `@latest` CLI.
