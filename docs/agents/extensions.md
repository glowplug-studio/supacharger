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

New bundles use schema version 3. Keep distributable files under `payload/` and describe each source, destination and ownership in `extension.json`.

```text
supacharger-ext-<id>/
├── AGENTS.md                         Consumer integration instructions
├── README.md                         Purpose, setup, configuration and API
├── LICENSE.md                        Extension licence
├── extension.json                    Bundle manifest
└── payload/
    ├── app/
    │   ├── supacharger-ext-<id>.config.ts
    │   ├── messages/en.json
    │   ├── _components/
    │   └── _lib/
    ├── supabase/
    │   ├── shared/
    │   ├── functions/ext-<id>/
    │   └── migrations/
    └── docs/
        ├── INSTALL.md
        └── bruno/
```

Only include directories the extension needs. `payload/docs/INSTALL.md` is required. Maintainer-only instructions belong in the separate extension contributor repository, not the installed payload. Repository-level files are not installed unless included through a supported payload mapping.

| Repository source | Application destination |
| --- | --- |
| `payload/app/<file>` | `src/app/(project)/(extensions)/(sc_extensions)/(<id>)/<file>` |
| `payload/supabase/shared/<file>` | `supabase/functions/_shared/extensions/sc_ext-<id>/<file>` |
| `payload/supabase/functions/ext-<id>/<file>` | `supabase/functions/ext-<id>/<file>` |
| `payload/supabase/functions/ext-<id>-<suffix>/<file>` | `supabase/functions/ext-<id>-<suffix>/<file>` |
| `payload/supabase/migrations/<timestamp>_ext_<underscore-id>_<name>.sql` | `supabase/migrations/<same filename>` |
| `payload/docs/<file>` | `docs/extensions/<id>/<file>` |

Migrations go directly into the application's migration directory, not a nested extension directory. Use the Supabase CLI to generate migration timestamps. Mark migrations `kind: "migration"`; never rewrite installed history. Mark exactly `payload/app/supacharger-ext-<id>.config.ts` as `kind: "config"`. Other files omit `kind` and are verified byte-for-byte. Secrets must not appear in config defaults or committed payloads.

Schema 3 uses `id: "<id>"`, `name: "supacharger-ext-<id>"`, a three-integer version string, `coreOwnershipVersion: 2` and `files`. Each file declares `source`, `target` and, where needed, `kind`. Targets must exactly match the mapping above. The installer rejects arbitrary destinations, path traversal, symlinks, conflicting ownership, migration timestamp collisions and conflicting installed file contents.

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
