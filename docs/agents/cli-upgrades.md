# CLI installation and upgrades

## Ownership

`supacharger init` installs the canonical starter and records its Git commit in `.supacharger/core-lock.json`. Version 2 of `.supacharger/managed-files.json` separates exact managed paths, merge-managed files, forward-only migrations and developer-owned paths.

Exact managed files are owned by Core. Developer-owned paths are preserved. Package dependencies and local Supabase configuration are merged through explicit updater logic. The blank `tailwind.project.config.ts` file is the developer extension point for the exact-managed `tailwind.config.ts`.

## Diagnosis

`supacharger doctor` is read-only and uses Git. It downloads the installed Core commit and the requested incoming commit into temporary directories, then reports:

- managed project files that are missing or differ from the installed commit;
- files added, changed or removed by the incoming commit; and
- property names present in incoming `src/supacharger.config.ts` but absent from the project's developer-owned configuration.

The comparison reads file contents directly. It creates no file hashes or lock catalogue. The only persistent revision identifier is the Git commit already stored in `.supacharger/core-lock.json`. The temporary directories are removed after inspection.

Use `--ref <tag-or-commit>` to inspect a specific revision. Maintainers may use `--source <path>` with a clean local Core checkout. Remote `doctor` prints the yellow development warning because it contacts the private GitHub repository; local `--source` and public-skills operations do not.

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

The updater does not distribute, generate or run application tests, fixtures, database tests, test package scripts, lint, TypeScript or Bruno parity checks.

## Forward migrations

Until the migration system is replaced, migrations remain append-only. A new canonical filename is copied only when absent. If an existing file with the same name has different contents, the update stops. A reviewed equivalent under another filename may be declared in `.supacharger/migration-aliases.json`; the replacement file must exist.

## Optional developer resources

The private `.agents/supacharger/core-development/` contributor checkout remains opt-in through `supacharger coredev install` and `supacharger coredev update`. Ordinary CLI commands do not initialise it.

Public skills remain separate. Their own `.supacharger/skills-lock.json` contains source commits and integrity hashes because skills are independently installed files; this does not affect Core file comparison.
