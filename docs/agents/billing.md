# Billing and Stripe contract

## Ownership

Supacharger owns the reusable user-billing implementation. The canonical managed paths are:

- `src/lib/stripe/`
- `src/features/pricing/`
- the billing controllers in `src/features/account/controllers/`
- `src/app/(supacharger)/api/webhooks/`
- `src/app/(supacharger)/api/(supacharger)/stripe/`
- `src/app/(supacharger)/(authenticated)/account/billing/`
- billing objects in `src/lib/supabase/types.ts` and `supabase/migrations/`

Consumers receive approved changes through the Supacharger CLI. Product-specific prices, copy, branding, tax settings, and organisation-billing rules remain application decisions. Specdrive uses organisation ownership and must not receive the user-owned contract without a separate design decision.

## Supported contract

- Stripe Node `22.5.0` with API `2026-07-29.dahlia` is the tested tuple for this release.
- Stripe is authoritative for customers, products, prices, subscriptions, and their lifecycle state.
- Supabase stores an application projection in `app`; it is not an editable billing source of truth.
- Hosted Checkout and the Billing Portal are the browser-facing Stripe surfaces.
- The canonical implemented payment mode is subscriptions. One-time fulfilment is not part of the reliable event projection yet.
- The current owner is one authenticated Supabase user. Organisation billing is an extension, not an alias for a user ID.

## Webhook processing

The public webhook route must:

1. read the unmodified request body;
2. verify `stripe-signature` with `STRIPE_WEBHOOK_SECRET`;
3. insert the event metadata and versioned payload durably;
4. acknowledge duplicate event IDs without repeating side effects; and
5. return `2xx` after durable acceptance, scheduling immediate processing outside the response.

`app.stripe_events` is the claim, lease, retry, and status ledger. `app.stripe_event_payloads` retains the signed snapshot payload for 30 days by default so processing remains compatible with the event's API version. The retry route is authenticated with `STRIPE_EVENT_PROCESSOR_SECRET`; deploy it behind the platform scheduler. Processing is idempotent by event ID and refreshes current subscription state from Stripe where ordering matters.

Subscribe only to the implemented events:

- `product.created`, `product.updated`, `product.deleted`
- `price.created`, `price.updated`, `price.deleted`
- `checkout.session.completed`
- `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`
- `customer.subscription.paused`, `customer.subscription.resumed`

Do not select all Stripe events. Add an event only with a handler, idempotency rule, test fixture, retry behaviour, and documentation.

## Database security

- Billing objects use the `app` schema with explicit grants and RLS.
- Only server-side secret/service-role clients may mutate Stripe projections or event tables.
- `anon` and `authenticated` may read the catalogue where the application's exposed-schema policy permits it.
- Authenticated users may read only their subscription and profile rows.
- User profile updates are restricted to `full_name` and `avatar_url`; Stripe-sourced billing/payment fields remain server-owned.
- `stripe_customer_id` is non-null and unique.
- Nullable lifecycle timestamps have no fabricated `now()` defaults.
- Full event payloads must never be returned through the Data API or logged.

## Secrets and version upgrades

`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, and `STRIPE_EVENT_PROCESSOR_SECRET` are server-only and distinct per environment. The hosted Checkout flow does not currently use Stripe.js, so there is no publishable Stripe browser key.

Upgrade the Node SDK, explicit API version, Stripe event destination version, fixtures, types, and documentation together. Test in a Stripe Sandbox before changing a production event destination. Never select a preview API implicitly.

## Required verification

- TypeScript compilation and timestamp regression tests.
- Fresh and upgrade migration execution, generated types, database advisors, explicit grant checks, and RLS tests.
- Valid/invalid signatures, duplicate delivery, reverse ordering, retry leases, poison events, and replay.
- Stripe Sandbox Checkout, subscription changes, cancellation, pause/resume, and portal return.
- CLI dependency installation, migration dry run, explicit apply confirmation, and migration-list verification.

The Supacharger repository MCP is descriptive and read-only. It must not accept Stripe secrets, call a live Stripe account, apply migrations, or expose billing records.

Stripe Sync Engine is not the canonical default. Its upstream repository warns that
it lacks tight access controls and should be deployed only internally. Treat any
future adoption as a separately approved architecture and security migration, not
as a drop-in replacement for this contract.
