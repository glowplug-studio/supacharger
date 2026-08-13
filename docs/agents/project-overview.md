# Supacharger project overview

Supacharger is an open-source starter core for building modern applications with Next.js, Supabase, Stripe, transactional email, Tailwind CSS, and reusable UI primitives.

The repository serves two roles:

1. It is the canonical implementation of reusable Supacharger behaviour.
2. It is the template source installed and updated by the Supacharger CLI.

Consuming applications may test features before they reach the core. Promotion is deliberate: compare implementations, identify application-specific assumptions, obtain the human owner's decision, land the canonical version in the core, document it, and then synchronise consumers.

The long-term goal is a deep, stable starter interface that applications extend without forking or editing CLI-managed implementation files.

Localisation follows the same boundary: protected Supacharger components consume `next-intl`, while each application owns its supported locales, request configuration, and message catalogues. Locale selection is preference-based and does not alter SaaS route paths.
