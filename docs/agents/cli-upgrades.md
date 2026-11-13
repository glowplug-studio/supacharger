# CLI installation and upgrades

## Command discovery

Read `supacharger --help` and `<command> --help` from the installed CLI before acting. Use `supacharger --version` for the CLI, `supacharger which --core` for the installed Core, and `supacharger which --extension <name>` for the registry's published extension version (not an installed-version receipt). The MCP exposes this document as `cli_upgrades`; it supplies guidance, not a command executor.

The simulated configuration and Supabase setup wizard is disabled. It does not provision a project, change Auth settings, deploy resources or start localhost. Complete those tasks using the installation guide.

## Ownership

`supacharger init` reads the public schema-2 registry and installs the exact registered Core release. It uses Git when available or the descriptor's checksum-verified ZIP otherwise. Source is prepared in a temporary sibling directory before the target is touched. The CLI writes the registered repository, semantic version and exact commit to `.supacharger/core-lock.json`; this lock is generated during installation rather than stored in Core source.

Normal initialisation output presents registry lookup, workspace creation, verified download, application preparation, lock creation, installation and cleanup as seven numbered purple stages. Internal repository URLs, commits and temporary paths remain available through errors rather than cluttering successful setup.

From an installed project or any nested directory, `supacharger which --core` walks upwards to the nearest Core lock and prints its required semantic version. `supacharger --version` remains the CLI package version.

Interactive initialisation first asks for the optional Supabase project code. It validates a supplied value against `^[a-z][a-z0-9_]{0,5}$` and writes the string, or `''` for an empty answer, only to `PROJECT_NAMESPACE` in developer-owned `src/supacharger.config.ts`. An empty code selects `sc_`; `wake` selects `sc_wake_`. It does not create another prefix setting. Before target replacement, installation uses this same value to prepare the initial database migration, declarative definitions, Supabase configuration and generated Edge resource map. Updates preserve the application-owned value.

Initialisation then creates `.env.local` from `.env.local.example`. It groups Supabase and Stripe prompts, masks sensitive input and leaves an example value unchanged when the developer presses Enter without supplying a value. It always generates the image-upload signing secret and generates separate event-processor and reconciliation secrets when Stripe setup is selected. It then offers application-package installation (`npm ci` with a lockfile, otherwise `npm install`) before the public skills checkbox selector and an optional transactional-email selection, enabled by default. Selection downloads the registered release ZIP, verifies its SHA-256 checksum and calls the extension installer. Missing release metadata or unmet dependencies are reported without claiming installation.

If a target contains files, the CLI names the folder and explains that `.git` is preserved while every other entry will be replaced only after Core downloads successfully. It accepts `Y` to continue or `n` to print `Exiting.` and stop. Ctrl+C exits without an exception trace and reports whether Core was already installed.

Version 2 of `.supacharger/managed-files.json` separates exact managed paths, merge-managed files, forward-only migrations and developer-owned paths.

Exact managed files are owned by Core. Developer-owned paths are preserved. Package dependencies and local Supabase configuration are merged through explicit updater logic. The blank `tailwind.project.config.ts` file is the developer extension point for the exact-managed `tailwind.config.ts`.

## Extension inspection

`supacharger doctor --extension <name>` downloads the registered release and compares its installable payload with the application. `--source <path>` supplies local source instead; `--registry <location>` and `--root <path>` select the registry and application. `supacharger extension doctor <name>` remains supported. Differences are printed and return status 1; this is a completed inspection with findings, not an unhandled exception. No files are changed, developer configuration is preserved, and deployment health is not checked.

Registry listing uses schema-2 descriptors. The installed marker requires the entry, config, installation guide and agent guide as regular files at their canonical locations. It does not imply enabled, current or deployed. There is no pending installed-record format.

## Diagnosis

`supacharger doctor` is read-only and uses Git. It downloads the installed Core commit and the requested incoming commit into temporary directories, then reports:

- managed project files that are missing or differ from the installed commit;
- files added, changed or removed by the incoming commit; and
- property names present in incoming `src/supacharger.config.ts` but absent from the project's developer-owned configuration.

The comparison reads file contents directly. It creates no file hashes or lock catalogue. The persistent installation identifiers are the semantic version and exact Git commit stored in `.supacharger/core-lock.json`; file comparison uses the commit. The temporary directories are removed after inspection.

Use `--ref <tag-or-commit>` to inspect a specific revision. Maintainers may use `--source <path>` with a clean local Core checkout.

## Planning and updating

`supacharger coreupdate --plan` compares the same installed and incoming revisions without changing the application or a database. It reports exact writes and removals, dependency changes, configuration additions, English catalogue additions, migrations, aliases and manual merge targets.

A real update:

1. compares local managed files directly with the installed Core commit;
2. reports conflicts and optionally backs up replaced files;
3. installs the incoming exact files while preserving developer-owned paths;
4. merges required dependencies and supported configuration changes;
5. handles forward migrations through the existing preview and separate confirmation flow;
6. directly compares every installed managed file with the downloaded target; and
7. advances `.supacharger/core-lock.json` only when the files match.

The updater does not distribute, generate or run application tests, fixtures, database tests or test package scripts. Tests in a consuming application are project-owned and agents create them only when the human explicitly requests them. Lint, TypeScript and Bruno parity checks also remain outside the updater.

## Forward migrations

For declarative Core releases, installation prepares one verified initial migration for the selected namespace. `--namespace <code>` selects the project code explicitly; non-interactive omission selects the default `sc_`. This runs before optional environment prompts, without requiring application dependencies to be installed.

Updates merge old Core, incoming Core and application definitions using the existing `PROJECT_NAMESPACE`, preserving product additions and stopping on conflicts. Native sync generates a forward migration against the application's own history. The CLI never copies the fresh baseline or incoming Core chain into an existing declarative application. Review SQL and the complete linked dry run before approving a push. The Core lock does not advance while database work remains unfinished. See [database ownership, data-upgrade limits and recovery](declarative-database.md).

Legacy releases without the declarative distribution contract retain the old append-only copying and explicit `.supacharger/migration-aliases.json` behaviour. Do not use that legacy path to bypass a declarative update failure.

## Optional developer resources

The private `.agents/supacharger/core-development/` contributor checkout remains opt-in through `supacharger coredev install` and `supacharger coredev update`. Ordinary CLI commands do not initialise it.

Public and licensed skills remain separate from Core. Their own `.supacharger/skills-lock.json` contains the actual source repository, immutable commit and one SHA-256 digest for the complete installed skill directory; this does not affect Core file comparison. Licensed skills are absent from the public selector and require an authorised committed checkout through `--source` for installation and updates. A legacy local-source record mislabelled as public is corrected only when the same immutable commit and installed directory digest verify against the authorised checkout.

## Application test and reference cleanup

Initialisation filters test suites, fixtures, coverage output and test scripts from the cloned starter, including nested maintainer tooling. Installed skills are preserved. Core updates remove obsolete test package scripts, including scripts using a test runner under a check name; they do not sweep developer-owned application files. Existing application tests remain project-owned. Agents create or change them only when the human explicitly requests that work. CLI maintainer tests stay in the CLI repository.

`docs/agents/` is developer-owned in applications. Updates install missing Markdown references, including the orientation index, and preserve existing files. Review upstream reference changes deliberately alongside the implementation; copying documentation alone does not upgrade runtime behaviour. The update plan reports removed test scripts.

## Request-domain URL upgrade

Managed URL helpers, Auth routes and billing service now distinguish request origins from the canonical URL. New helpers live under the existing managed `src/supacharger/` root; no CLI engine change is required to distribute them. Developer-owned callback adapters must build destinations from `context.requestUrl.origin`; `getAuthLoginRedirect(destination, origin)` now requires that explicit second argument. Preserve product onboarding, organisation and MFA rules while updating these calls. Application Server Actions outside managed paths must use `getRequestURL()` for Auth email destinations.

The CLI preserves callback adapters and environment files. Merge the recovery/email-change RedirectTo contract and APP_ALLOWED_ORIGINS documentation deliberately; copying Core code alone does not configure hosted Auth. Deploy code, register redirect destinations, then install the templates. This upgrade has no database migration.

## Logout session-policy configuration upgrade

`SUPABASE_AUTH.SESSION.SIGN_OUT_ALL_DEVICES` is a required boolean in the Core configuration contract. The approved configuration migration inserts `true` only when the key is missing and preserves every existing `true` or `false` value and unrelated application setting. The default retains all-device logout; an application may explicitly select `false` for current-session logout after its security-policy approval. Review the reported configuration addition, deploy the matching managed `logoutUser` implementation, and rebuild the application. Missing legacy values retain all-device logout at runtime during rollout. This is build-time application policy, not a Supabase Dashboard setting or database migration. See [authentication policy](authentication-and-claims.md#logout-session-policy).
