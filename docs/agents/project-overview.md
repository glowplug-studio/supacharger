# Supacharger project overview

Supacharger is an open-source starter core for building modern applications with Next.js, Supabase, Stripe, transactional email, Tailwind CSS, and reusable UI primitives.

The repository serves two roles:

1. It is the canonical implementation of reusable Supacharger behaviour.
2. It is the template source installed and updated by the Supacharger CLI.

Consuming applications may test features before they reach the core. Promotion is deliberate: compare implementations, identify application-specific assumptions, obtain the human owner's decision, land the canonical version in the core, document it, and then synchronise consumers.

The long-term goal is a deep, stable starter interface that applications extend without forking or editing CLI-managed implementation files.

## Canonical application structure

`.supacharger/managed-files.json` is the executable ownership source of truth. The principal boundaries are:

- `src/app/(supacharger)/` and `src/supacharger/`: exact managed routes, behaviour and contracts;
- `src/app/(project)/`: preserved product, marketing, onboarding, plugin and product API routes;
- `src/supacharger.adapters/`: preserved product composition around managed behaviour;
- `src/components/sc_widgets/`: editable widgets supplied with the initial project and preserved by Core updates;
- `src/components/sc_demo/`: removable application examples;
- `src/components/ui/`: application and shadcn primitives;
- `src/styles/`: preserved application presentation for managed semantic markup;
- `src/lib/supabase/types.ts`: generated application database types;
- `tailwind.config.ts`: exact managed root configuration; and
- `tailwind.project.config.ts`: blank preserved preset for project and installed-extension additions.

Route groups do not change public URLs. Core owns its authenticated, verified, unauthenticated and API routes inside `(supacharger)`. Application onboarding and all product routes remain inside `(project)`. A repository path omitted from the manifest is not implicitly Core-managed.

Localisation follows the same boundary: protected Supacharger components consume `next-intl`, while each application owns its supported locales, request configuration, and message catalogues. Agents always author English source copy and leave secondary-language values empty or untouched unless the human explicitly requests translation. Locale selection is preference-based and does not alter SaaS route paths. A transient `?lang=<two-letter-code>` marketing handoff is captured into the locale cookie, synchronised to the authenticated profile, and removed from the URL.

The root HTML document uses a template-plus-core model. A new project receives an editable, developer-owned `src/app/layout.tsx`; the protected `src/supacharger/root-document.tsx` module standardises metadata, viewport, favicon declarations, page-level SEO composition, and configured analytics. `SupachargerConfig` carries canonical URL, title-template, indexing, root-provider, and analytics policy without hard-coded product values.

Billing is account-based rather than user-owned. A billable account can represent a user, organisation, team, tenant, or custom subject; users participate through account membership. Stripe Customers map to billing accounts, Customers may own multiple Subscriptions, and Subscriptions may contain multiple Items. Application access is expressed through entitlements rather than hard-coded Price IDs. See `docs/agents/billing.md` before changing any billing path.

The shared database foundation uses one `app.profiles` row per Auth user, a private `user-avatars` bucket, owner-only current-profile reads, and a safe general profile projection without email. Profile-row creation is unconditional; application configuration controls only whether incomplete users are redirected. See `docs/agents/database-foundation.md` before changing profiles, Auth triggers, schemas, storage paths, Proxy routing, or protected server-access checks.

Reusable image uploads use the authenticated `process-image-upload` Edge Function. The request supplies a file, named target and optional validated relative destination below the authenticated user's ID, and optional `crop` JSON text in oriented source pixels. Application-owned target policy fixes the bucket and transformation values, and the caller's Storage RLS remains authoritative. See `docs/agents/image-transformation.md` before changing image processing, targets, Storage paths, or upload wrappers.

Untrusted form and request input is validated with Zod at the receiving server-side JavaScript or TypeScript boundary. Edge Functions validate structured input before privileged work or RPC calls; PostgreSQL RPCs independently enforce their typed, constrained, and authorised database contracts. See `docs/agents/input-validation.md` before changing forms, Server Actions, route handlers, Edge Function requests, or RPC inputs.

Authentication Proxy, global roles, JWT custom claims, and resource-membership boundaries are defined in `docs/agents/authentication-and-claims.md`. Use one verification call, preserve cookies plus auth anti-cache headers on every response, and keep RLS authoritative.

## Agent orientation

Start at root `AGENTS.md`, which loads shared working rules, project instructions and optional contributor policies. Read `agent-guidance.md` for the routing map. Technical conventions remain in this `docs/agents/` directory and are exposed by the repository-knowledge MCP; repository-specific rules live in `docs/agents/project.md`.
