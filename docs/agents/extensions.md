# Working with extensions

An extension is a separately installed capability. Application extension files live under `src/app/(project)/(extensions)/`. Supacharger-distributed extensions use `(sc_extensions)/` beneath that directory; project extensions may use sibling groups.

## Application files

For an extension with registry name `supacharger-ext-invitations` and bundle ID `invitations`, use:

```text
src/app/(project)/(extensions)/(sc_extensions)/(invitations)/
├── supacharger-ext-invitations.config.ts
├── messages/en.json
├── _components/
└── _lib/
```

This is a layout example, not an installed invitations feature. Parenthesised groups do not contribute URL segments. They do not prevent `page.tsx` or `route.ts` from exposing a route. Keep import-only code in private `_components` and `_lib` directories, and review intentional routes for URL collisions and authorisation.

The application developer owns the config file; the installer creates it only when missing and preserves it during updates. Other manifest-listed files are extension-managed. Their location under `(project)` does not make them safe to overwrite during a Core update or edit without an extension-upgrade plan.

UI notification text belongs in the extension's `messages/en.json` using a namespace unique to the extension. Integrate it with the application's next-intl catalogue explicitly; copying a catalogue does not load it. Follow the English catalogue policy and do not generate secondary translations unless requested. Transactional email uses provider-hosted templates or application-rendered content according to the selected transport; keep it separate from UI localisation.

## Extension repository structure

Transactional email is the reference package. Every installable bundle has schema-3 `extension.json`, an explicit `files` list, and four required payload files: `payload/app/index.ts`, `payload/app/supacharger-ext-<id>.config.ts`, `payload/docs/INSTALL.md` and `payload/agents/AGENTS.md`. Dependencies and required Core services are explicit arrays. Optional UI, backend, API and translation directories contain actual implementation only; disabled shells need no executable placeholders.

Static packages keep the manifest at their source root. Transactional email emits the complete manifest beside its rendered payload in `.prepared/<code>/` or `.prepared/default/`. Use that prepared directory for installation, not its unprepared source repository. Package preparation is explicit and can populate a CLI-created host migration; read its guide first. The installer does not execute preparation code.

## File ownership contract

The installable package's `extension.json` is the single file-ownership contract. Each `files` entry names one repository-relative `source`, one application-relative `target` and an optional `kind`. Paths are explicit: there are no ownership globs, second ownership manifests or installed receipt files.

| Classification | Ownership and behaviour |
| --- | --- |
| No `kind` | Extension-managed source or documentation. Updates compare and replace incoming bytes. |
| `kind: "config"` | Consumer-owned `supacharger-ext-<id>.config.ts`. Created when missing and preserved on updates. |
| `kind: "schema"` | Extension-managed declarative SQL. Installed under `supabase/schemas/extensions/<id>/`, with namespace rendering. Deployment is a separate operation. |
| `kind: "migration"` | Immutable SQL history. Existing bytes must match; changes require a new forward migration. |

The contract covers the payload exactly and rejects duplicate destinations, symlinks, path traversal, unsupported mappings and misclassified files. Each package's `npm run check` validates this authoring standard. The CLI separately validates installation destinations against Core ownership. Package validation does not prove runtime behaviour or deployed readiness.

Consumer customisations belong in the config and application-owned adapters outside manifest-listed implementation files. Inspect the update plan and Git diff: direct file comparison cannot distinguish a local customisation from an upstream change. Unlisted application files are left alone; they are not an automatic extension API. Keep the incoming package available when reviewing ownership; the installer does not retain a manifest receipt.

SHA-256 `archive_checksum` in the registry describes the exact release ZIP. It is not a per-file ownership field or a Git commit ID. No per-file hashes are required in `extension.json`.

## Install and verify

The updated CLI source supports reviewed local bundles:

```sh
supacharger extension install <id> --source /path/to/extension --plan
supacharger extension install <id> --source /path/to/extension
supacharger extension doctor <id>
```

Check your installed CLI help: releases predating this change do not expose these commands. This source change does not publish an npm release. The Core maintainer entry point is `node tools/supacharger-extensions/cli.cjs` with the same install/doctor arguments.

The installer copies manifest-listed files directly into their mapped destinations and checks the copied bytes. It does not write installation receipts, hashes, baseline snapshots or comparison prompts. Developer-owned configuration is preserved. No Core lock is advanced.

Installation does not apply migrations, run seed scripts, execute downloaded code, set secrets, deploy functions, load next-intl catalogues or implement an enabled/disabled lifecycle. Registry checks are available for supplied local Git sources with --registry; see Local release comparison below. Do not advertise those planned capabilities as operational. Private download/entitlement systems are also not implemented; use only explicitly reviewed local sources.

## Project integration

Commit installed extension source and developer configuration with the application. Keep database migrations forward-only.

Follow the installed `docs/extensions/<id>/INSTALL.md` for setup. Apply database migrations, configure secrets and deploy backend services as explicit project operations; file installation does not perform those actions.

## Instructions for development and application use

Instructions for agents developing extensions live in the separate optional `supacharger-ext-development-agents.md` Git repository, checked out inside Core at `.agents/supacharger/extension-development/`. Its master AGENTS.md links shared guidance and `extensions/<registry-name>/AGENTS.md`. Applications do not require this private checkout.

Application-use instructions are authored in each extension’s `payload/agents/AGENTS.md`. The agreed destination is `docs/agents/extensions/<registry-name>/AGENTS.md`, only for installed extensions. The local installer supports this mapping for manifest-listed files; use a CLI build containing that support. Read the relevant guide only for that extension’s task and verify enablement separately.

## Local release comparison

Versioned ZIP fetching is **coming soon**. Use reviewed local source folders with a CLI build containing these commands:

```sh
supacharger extension install supacharger-ext-brevo --source /path/to/release --plan
supacharger extension update supacharger-ext-brevo --source /path/to/new-release --plan
```

Remove `--plan` to apply the listed changes. The CLI compares each installed destination directly with its incoming payload file. Equal files are skipped; differing extension-owned files are replaced. Developer configuration is preserved, existing migrations must match exactly, and unlisted project files are left alone. This comparison does not infer whether a difference is a local customisation or an upstream change; inspect the plan and Git diff before applying an update.


Optional `--registry /path/to/registry.json` verifies an incoming release against schema-1 registry metadata and checks fixed and configured-provider dependencies. Registry verification currently requires a local Git checkout containing the exact source commit; extracted archives are supported only in explicitly reviewed local-source mode until archive verification/fetching is implemented. Without `--registry`, the result reports `registryVerified: false`: files are compared directly, but no registry authenticity claim is made.

Dependency checks inspect the standard installed entry and configuration files. Missing source and disabled configuration stop installation. Required Core services resolve through the application configuration. Installation does not contact services, apply SQL, deploy workers or send email.


## Build-time extension selection

Core provides `src/supacharger/extensions/prepare.cjs`. Call it from the application's
`next.config.js` before exporting Next configuration:

```js
const { prepareExtensions } = require('./src/supacharger/extensions/prepare.cjs');
prepareExtensions({
  root: __dirname,
  extensions: [{
    id: 'invitations',
    services: ['transactional_email'],
    fallback: 'src/supacharger.adapters/invitations/unavailable.ts',
  }],
});
```

The example requires an application-owned unavailable adapter exporting the same
public interface as the extension's `payload/app/index.ts`. Add only integrations
used by that application. Integration registrations declare their required capabilities using `services`. Core resolves each capability from `SC_CONFIG.CORE_SERVICES`; see [Core services](core-services.md).

Preparation reads the installed `supacharger-ext-<id>.config.ts` as literal data,
including an optional `as const` assertion. Imports, function calls, spreads and
computed configuration are rejected rather than executed. A missing extension
selects the fallback; an installed extension missing its config fails. With
`enabled: false`, the generated entry imports only the fallback and exports an empty
catalogue. With `enabled: true`, it imports the installed `index.ts` and exports its
optional `messages/en.json` as `extensionMessages`. Required Core services must resolve to enabled installed service entry points.

Import from `src/supacharger.adapters/generated/extensions/<id>.ts`; never edit that
generated file. It exports `extensionEnabled`, the selected entry's exports and
`extensionMessages`. Application controls must use that interface and hide themselves
when unavailable. Merge the namespaced messages into next-intl's request catalogue;
exporting a catalogue does not automatically load it. Product-specific copy stays
with the application. Restart dev/build after config changes, and regenerate before
standalone type checks if installed files or config changed.

Inactive generated entries contain no payload import, so the runtime dependency
graph does not include the extension through that entry. Direct payload imports
bypass the boundary and are unsupported. TypeScript may still check files present
in the repository; type checking is distinct from runtime bundling.

Preparation writes local modules only. It performs no SQL, network request, migration
or deployment. Database administration is an explicit SQL operation, independent
of frontend configuration and file removal. These build checks do not replace CLI update/drift verification.

### Database administration is explicit

Build preparation only selects application code. It never generates SQL, changes Supabase, or disables a hosted extension. Removing extension files leaves its database tables and data in place. When asked to disable a hosted module, an agent may use the Supabase MCP to execute its documented administrative SQL against the verified project, then read the setting back. Do not infer a request to disable the database from a frontend build or file removal. Follow the installed extension guide for its SQL and any provider-specific queued-delivery handling.

## Declarative definitions

Manifest files with `kind: "schema"` map `payload/supabase/schemas/` into `supabase/schemas/extensions/<id>/`. The installer renders default `sc_` references using `PROJECT_NAMESPACE`; original migrations remain immutable. Read [declarative database guidance](declarative-database.md) before composing or deploying these definitions. Installation alone never applies SQL.
