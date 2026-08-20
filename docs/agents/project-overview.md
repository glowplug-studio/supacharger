# Supacharger project overview

Supacharger is an open-source starter core for building modern applications with Next.js, Supabase, Stripe, transactional email, Tailwind CSS, and reusable UI primitives.

The repository serves two roles:

1. It is the canonical implementation of reusable Supacharger behaviour.
2. It is the template source installed and updated by the Supacharger CLI.

Consuming applications may test features before they reach the core. Promotion is deliberate: compare implementations, identify application-specific assumptions, obtain the human owner's decision, land the canonical version in the core, document it, and then synchronise consumers.

The long-term goal is a deep, stable starter interface that applications extend without forking or editing CLI-managed implementation files.

Localisation follows the same boundary: protected Supacharger components consume `next-intl`, while each application owns its supported locales, request configuration, and message catalogues. Locale selection is preference-based and does not alter SaaS route paths. A transient `?lang=<two-letter-code>` marketing handoff is captured into the locale cookie, synchronised to the authenticated profile, and removed from the URL.

Billing is account-based rather than user-owned. A billable account can represent a user, organisation, team, tenant, or custom subject; users participate through account membership. Stripe Customers map to billing accounts, Customers may own multiple Subscriptions, and Subscriptions may contain multiple Items. Application access is expressed through entitlements rather than hard-coded Price IDs. See `docs/agents/billing.md` before changing any billing path.

The shared database foundation uses one `app.profiles` row per Auth user, a private `user-avatars` bucket, owner-only current-profile reads, and a safe general profile projection without email. Profile-row creation is unconditional; application configuration controls only whether incomplete users are redirected. See `docs/agents/database-foundation.md` before changing profiles, Auth triggers, schemas, storage paths, or profile middleware.

Authentication Proxy, global roles, JWT custom claims, and resource-membership boundaries are defined in `docs/agents/authentication-and-claims.md`. Use one verification call, preserve cookies plus auth anti-cache headers on every response, and keep RLS authoritative.
