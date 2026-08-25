# Specdrive Source Explorer — Supacharger Core handoff

Date: 26 August 2026

Specdrive work branch: `codex/SPECD-68-sauce-explorer-nightly`

Source plan: `/Applications/MAMP/htdocs/_SUPACHARGER-PROJECTS/specdrive-main/.agents/instructions/source-explorer-implementation-plan.md`

## Current boundary decision

Source Explorer is a Specdrive product capability. Its source snapshot tables,
browser RPCs, MCP upload RPCs, local CLI/MCP, OAuth-scoped workflow, routes,
Untitled UI explorer, navigation entries, English copy, Bruno requests, and
agent skill must remain in Specdrive-owned seams. No implementation or reusable
contract promotion into Supacharger Core is authorised or proposed by SPECD-68.

## Core-contracted surfaces touched in the consumer

The Specdrive execution changes protected contract categories without changing
their reusable Core definitions:

- forward-only Specdrive migration history;
- product-owned `app`, `api`, and `mcp_api` database objects and grants;
- generated Specdrive database types;
- product-owned OpenAPI and Bruno requests outside `docs/bruno/supacharger-rpc/`;
- repository/MCP file ownership and local CLI installation documentation;
- hosted Data API schema exposure for the restricted `mcp_api` RPC boundary;
- product routes, navigation, page titles, localisation, and agent guidance.
- the consumer root `AGENTS.md`, with a bounded product-owned
  `specdrive-source-sync` block that points to `.specdrive/config.json` and
  leaves every shared Supacharger guidance block unchanged;
- the consumer JSON schema-version registry, adding only the product-owned
  `specdrive.sourceTree.v1` history.

### Managed-boundary repair discovered during execution

Supabase CLI 2.115 refused to start the local stack because the managed
`supabase/functions/process-avatar/index.ts` type-only import still targeted
`../../../lib/supabase/types.ts`, while the current generated-type contract is
`src/lib/supabase/types.ts`. SPECD-68 repairs the Specdrive consumer import to
`../../../src/lib/supabase/types.ts`. This is a build-time path alignment only:
the Edge Function request, authentication, image transformation, Storage,
response, deployment, and database contracts are unchanged.

Core follow-up: inspect the canonical `process-avatar` template and CLI
installation output. If Core still emits the obsolete path, update it through a
separately reviewed Core-first change and propagate the exact managed file to
all consumers. Do not promote any Source Explorer behaviour as part of that
repair.

The canonical Supacharger Bruno collection, managed files, Core lock,
`SupachargerConfig`, shared authentication/route protection, shared assets, and
Core migrations must remain byte-identical and unmodified.

The user-level `/Users/j/.agents/skills/specdrive/` workflow is also extended,
but remains a Specdrive-specific orchestration skill and is not a Core skill or
managed consumer asset.

## Consumers and synchronisation

Synchronise only the Specdrive web app, linked Supabase project, product Bruno
collection, OpenAPI, generated types, repository-local MCP, independent
`glowplug-studio/specdrive-cli` repository, and Specdrive user skill. SnapScreen,
Wakekeeper, Supacharger CLI, Supacharger documentation, and other managed
consumers are unaffected.

## Migration, compatibility, deployment, and data risk

- Additive product tables/RPCs avoid changes to existing Core data and routes.
- Atomic source generations ensure failed uploads never replace active source.
- Direct table grants remain revoked; narrow RPCs recheck project membership.
- Source content lives in Postgres, not Supabase Storage; no Core Storage
  filesystem contract changes.
- The independent CLI/MCP move removes the tracked legacy MCP package and
  dependency tree from the Specdrive parent only after the nested repository is
  available and verified.
- Do not advance `.supacharger/core-lock.json` or rewrite managed assets.

## Hosted Data API alignment performed

The hosted project initially exposed `api`, `api_edge`, `graphql_public` and
`public`, so legitimate `mcp_api` PostgREST calls returned HTTP 406. The owner
authorised execution and the hosted setting now exposes only `api`, `api_edge`,
`graphql_public` and `mcp_api`. `public` was removed; private `app`,
`app_private` and `authz` remain unexposed. This is a deployment setting change,
not a migration or reusable Core contract change, but future CLI/deployment
alignment should preserve the intended explicit schema allow-list.

## Remaining external blocker

GitHub SSH, both independent repositories, Docker file sharing and Chrome are
resolved. The CLI and MCP branches are implemented and pushed; the MCP exposes
eight tools and two canonical resources and reaches the hosted authorisation
boundary. A clean Night Garden fixture is ready at
`/Applications/MAMP/htdocs/_SUPACHARGER-PROJECTS/specdrive-source-explorer-sample`
commit `c22c132`.

The final sample synchronisation and authenticated Chrome matrix wait only for
the owner to unlock 1Password and complete the retained `j@sharpi.sh` Specdrive
OAuth login/consent. Do not use a password reset, magic link, service role or
direct database write as a workaround. This blocker does not affect Core,
hosted migration deployment, compilation or database verification.

## Promotion trigger

If a later task proposes Source Explorer as reusable Core functionality, stop
at the approval gate. Report the reusable subset, licence/provenance constraints,
consumer configuration contract, CLI update semantics, migration path, and
documentation impact before changing this repository.
