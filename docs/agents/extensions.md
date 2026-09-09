# Extensions: local source bundles

The canonical catalogue is `extensions/`. Start with `extensions/brevo-email/extension.json` and `extensions/brevo-email/payload/INSTALL.md`. The canonical installer is `tools/supacharger-extensions/installer.cjs`; the separate CLI ships a byte-identical copy under `commands/extensions/installer.cjs`.

## Commands

Run from the consuming application using the updated local CLI (not yet published):

```sh
supacharger extension install brevo-email --source /path/to/supacharger/extensions/brevo-email --plan
supacharger extension install brevo-email --source /path/to/supacharger/extensions/brevo-email
supacharger extension doctor brevo-email
```

Alternatively use Core's standalone entry point:

```sh
node /path/to/supacharger/tools/supacharger-extensions/cli.cjs install brevo-email --source /path/to/supacharger/extensions/brevo-email --root /path/to/app --plan
```

Remove `--plan` after reviewing the plan. MCP provides guidance only; it neither executes the CLI nor accepts credentials.

## Bundle contracts v1 and v2

`extension.json` declares `schemaVersion: 1` or `2`, lowercase slug `id`, immutable numeric `major.minor.patch` version, `coreOwnershipVersion: 2`, and `files` containing source, target and SHA-256 digest. Include `docs/extensions/<id>/INSTALL.md`. Allowed destination namespaces:

- `src/supacharger.extensions/<id>/`;
- `supabase/functions/_shared/extensions/<id>/`;
- `docs/extensions/<id>/`.

V2 additionally permits `supabase/functions/ext-<id>/` and files marked `kind: "migration"` targeting `supabase/migrations/<14-digit-version>_ext_<underscore-id>_<name>.sql`. Installed migration bytes are immutable across upgrades; timestamp collisions are rejected. No arbitrary worker or migration namespace is allowed.

All files are validated before writing. The installer refuses exact/merge-managed overlap, non-declared migration destinations, traversal, symlinks and checksum failures. Trust the bundle's source: hashes detect changed bytes, not publisher identity. Only reviewed local bundles are supported.

Installed source is extension-managed, separately from Core. `.supacharger/extensions/<id>.json` records its manifest/hashes without advancing the Core lock. Reinstallation is idempotent. Upgrades refuse locally edited/missing files, same-version republishing, downgrades and removed destinations. Resolve these manually; there is no force flag. Recovery files are under `.supacharger/extension-transactions/`, outside compilable source; keep them locally, not in Git. Caught write failures restore changed files. OS interruption may require manual recovery using that directory and Git.

Neither version installs dependencies, mutates package/config files, seeds databases, executes scripts, applies migrations, deploys endpoints, sets secrets or automatically removes extensions. V2 copies reviewed forward migrations; applying them remains explicit. Brevo pins its Edge Zod/Supabase imports.

## Runtime and integration

Core's signup form has no runtime extension registry or enabled checks. An uninstalled extension contributes no application imports, dependencies or network calls. Statically import installed modules only from developer-owned adapters. Do not customise module source with product names, queries or action mappings.

The Brevo factory accepts an environment reader, server-defined template environment name, optional API-key environment name and injected fetch. Its sender accepts authorised recipients, JSON parameters, stable idempotency key and optional reply-to/tags. Template content, subject and sender belong in Brevo. The module is private imported code, not a public HTTP relay; preserve independent action authorisation and database permissions.

Brevo 2.0.0 owns private delivery storage, immediate post-commit pg_net dispatch, a secret-authenticated worker and a minute pg_cron recovery job. Trusted callers pass props through `sendBrevoEmails(apiEdgeClient, notifications)` or call `brevo_email.enqueue(jsonb)` inside an authorised product transaction. The worker uses service-only `api_edge.brevo_email_enqueue`, `brevo_email_claim` and `brevo_email_finish` contracts; these exist only when the extension migration is installed. No default Core database or uninstalled app is changed.

Wakekeeper supplies only its archive adapter and an optional bulk SQL resolver for current account email and retry-time host privacy. The extension owns its queue and retries. Immediate dispatch covers every inserted batch without waiting for cron; cron recovers due failed or interrupted attempts. Read the installed guide for limits, Vault configuration, deployment and migration from existing queues.

Agents must read the installed guide, identify project-owned integration files, configure secrets without revealing values, mock failure paths, and separately report installation, integration, configuration, deployment and delivery verification. Source installation does not imply operational email delivery.

## Deferred work and rollout

Commercial purchases and tokens will be managed through Specdrive. Token verification, private repositories, signed downloads and purchase flows are not implemented. Do not give customers GitHub repository credentials or advertise a working token login. Future verified downloads should feed the same installer. Marketing contact synchronisation and automation enrolment are separate consent-aware features, not transactional-send side effects.

Only Core and Wakekeeper receive this release. SnapScreen and Specdrive remain deferred, including their newsletter stubs. Do not advance a consumer Core lock to imply a full update during this partial rollout. Removed registry/checkbox source remains recoverable from Git history.
