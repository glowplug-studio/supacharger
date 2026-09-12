# CLI installation and upgrades

## Ownership flow

`supacharger init` installs the complete canonical starter and records the Core commit in `.supacharger/core-lock.json`. `supacharger coreupdate --plan` is read-only: it compares that installed baseline with current Core and reports exact managed writes, obsolete removals, dependency and script merges, configuration additions, canonical English additions, forward migrations, migration aliases, manual merge targets, and post-update checks.

While the private repositories remain under development, the CLI prints a yellow demonstration warning before `init`, remote `coreupdate` or `coredev` contact GitHub. It does not warn for public-skills operations, `doctor` or local `coreupdate --source`.

A real update must preserve every `developerOwnedPaths` entry, replace only `managedPaths`, and use an explicit strategy for each `mergeManagedPaths` entry. It installs missing starter adapters and styles once, never overwriting established product implementations. It removes an obsolete managed file only when the installed baseline owned it; locally changed legacy route wrappers require a manual move into an adapter.

The Tailwind ownership migration makes `tailwind.config.ts` exact managed and installs the blank developer-owned `tailwind.project.config.ts` preset when absent. If the former merge-managed root file differs from both its installed Core baseline and the incoming exact Core file, stop before writes and require its project additions to be moved into the preset. Extensions that require Tailwind configuration modify only the project preset.

The compact session-cookie upgrade makes `src/lib/supabase/client.ts` and `src/lib/supabase/server.ts` exact managed paths alongside the existing Proxy client. An update replaces all three client implementations together so `cookies.encode: 'tokens-only'` cannot drift. Existing sessions are rewritten compactly on their next Auth state write or token refresh; no Supabase migration or hosted Auth setting change is required.

For the canonical MFA cleanup, the updater backs up the developer configuration, removes only obsolete `AUTHENTICATION.MFA_TOTP.ENABLED`, and preserves `REQUIRED_FOR_SIGN_IN`. It also enables `auth.mfa.totp.enroll_enabled` and `verify_enabled` in merge-managed local Supabase configuration. The developer must restart the local stack; hosted MFA capability remains separately configured in the Supabase Dashboard.

## Account-alignment migration

The approved configuration migration inserts only missing keys. Profile media defaults are optional, account cancellation remains disabled, organisations remain disabled, the chooser uses `/account/organisation`, root-handle routing uses `/{handle}/settings`, and organisation billing remains disabled. Existing branding, routes, enabled policies, and other product values survive.

The session-transfer migration inserts a missing `AUTHENTICATION.CROSS_DEVICE_SESSION_TRANSFER` object as `{ ENABLED: false, TOKEN_TTL_SECONDS: 120 }`. It must never overwrite an existing choice. Enabling a consumer remains a product decision; enabled Apple consumers also add `/auth/session-transfer` to their developer-owned associated paths.

The updater recursively merges Core's `messages/en.json` into the application's English catalogue. It adds a missing key or fills an empty English string, while preserving every existing non-empty value. It never creates, replaces, translates, or deletes a secondary catalogue during an update.

Developer-owned organisation starters include `chrome.tsx`, `navigation.ts`, `pages.tsx`, `profile-fields.tsx`, and `profile-extension.ts`. The CLI copies a missing file but preserves any existing implementation. The same rule applies to auth, account, billing, CSS, root layout, and project routes.

## Forward migrations

Migrations are append-only. A new canonical filename is copied only when absent; a same-name hash collision halts. If a consumer previously landed a reviewed schema-equivalent adaptation under a different immutable filename, map it explicitly in `.supacharger/migration-aliases.json`:

```json
{
  "supabase/migrations/20260824100000_add_organisation_management.sql": "supabase/migrations/20260824100001_add_organisation_management.sql"
}
```

The target must exist. `--plan` reports the mapping and the updater skips the canonical file. An alias is an audit record, not a way to waive schema parity; compare the contract and tests before declaring one.

## Completion and diagnosis

After file/config/catalogue work, the updater installs required dependency changes, previews pending linked migrations, obtains the separate database confirmation, verifies the linked ledger, runs every manifest check, and hashes every exact managed file. It advances the lock only after all work succeeds.

`supacharger doctor` is read-only. It identifies duplicate App Router pages after route-group normalisation, obsolete `/auth/*` and `/organisation` pages, incomplete account/organisation configuration, obsolete MFA visibility config, disabled local TOTP APIs, missing managed organisation routes/tests/adapters, missing English namespaces, invalid migration aliases, absent shared migrations, hook drift, recovery-route ancestry errors, missing scripts, and Bruno parity assets. It does not contact or mutate a hosted project.

### Git commit identity and image loader distribution

The CLI resolves a requested Git ref once and fetches that commit in both the clean and conflicting update paths. The lock records the checked-out commit only after the declared checks and exact-file verification succeed. To keep a separately reviewed plan and update on the same release, pass the same explicit commit SHA to both commands.

`src/assets/svgr/ui/image-loader.svg` is developer-owned. The CLI installs its starter only when absent and preserves customised copies, including through the fallback ownership rules for legacy updates. This support is implemented in the separate `supacharger-cli` repository; npm publication is still pending. Consumer Core locks must continue to identify their published baseline; local asset synchronisation does not advance them.

## Instructions, changelogs and free skills

The exact-managed manifest now includes `.agents/supacharger/guidance.md` and `CHANGELOG.md`. Root `AGENTS.md`, `.agents/project/`, existing task instructions, skills, legacy guidance, optional contributor checkout and `CHANGELOG.project.md` are preserved. The CLI installs missing root/project instruction and application-changelog starters; it does not overwrite an established entry point. Existing applications adopt the routing structure deliberately.

The private `.agents/supacharger/core-development/` contributor checkout is strictly opt-in. `supacharger coredev install` registers or initialises its fixed SSH Git submodule; `supacharger coredev update` refuses local changes before updating its configured remote branch. No ordinary CLI command installs, updates, reads, or removes it. A normal non-recursive clone leaves committed submodule contents uninitialised, while recursive cloning follows Git's standard submodule behaviour.

The independent public-skills commands install selected committed catalogue folders under `.agents/skills/`, recording source commits and hashes in `.supacharger/skills-lock.json`. Updates are explicit; Core updates neither install new optional skills nor update existing ones. Read `agent-guidance.md` for routing and the distinction from technical references in this directory.
