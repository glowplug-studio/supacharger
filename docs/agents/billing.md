# Billing and Stripe contract

## Domain model

Supacharger billing is account-based, not user-owned. A `billing_account` is the billable party and can represent a user, organisation, team, tenant, or application-defined subject. Users gain visibility and management authority through `billing_account_members`; never use the current user's ID as a substitute for a billing-account ID.

One billing account maps to one Stripe Customer per Stripe account and mode. A Customer may have multiple independent Subscriptions, and every Subscription may have multiple Subscription Items. Do not add code that selects `items.data[0]` as the complete plan. The legacy `subscriptions.user_id`, `price_id`, and `quantity` fields are compatibility aliases for one release only; new reads use `billing_account_id` and `app.subscription_items`.

Stripe remains authoritative for Customers, Products, Prices, Subscriptions, Subscription Items, and Stripe Entitlements. Supabase stores a query-efficient projection and application-owned manual/promotional entitlements; it is not an editable Stripe source of truth.

## Canonical implementation

Supacharger defines the reusable billing behaviour through:

- `src/lib/stripe/`;
- `src/features/pricing/`;
- the named billing controllers in `src/features/account/controllers/`;
- `src/app/(supacharger)/api/webhooks/` and the protected Stripe processor/reconciliation routes;
- exact protected Stripe webhook, processor, and reconciliation Route Handlers under `src/app/(supacharger)/`;
- developer-owned billing/account pages under `src/app/(project)/`, with acquisition under an onboarded-only route group and full billing-management surfaces under the full-app guard;
- billing objects in `src/lib/supabase/types.ts` and `supabase/migrations/`.

The manifest byte-protects the Route Handlers, not application table shapes. Stripe libraries, generated types, and billing controllers are application integration code that must satisfy the protected handlers' stable interfaces while adapting product schemas. Migration histories are forward-only and must never be byte-replaced.

Product catalogue content, tax registrations, payment-method Dashboard settings, entitlement definitions, copy, branding, account-subject provisioning, and organisation membership remain developer-owned policy. Consumers must adapt their product model to `billing_accounts`; they must not fork the core back to user-owned subscriptions.

The configured `BILLING_ACCESS.REDIRECT_PATH` must inherit `requireOnboardedUser()`, not `requireAppAccess()`. This lets a verified, profile-complete user without billing access acquire it while still keeping incomplete and unauthenticated users out. Checkout query parameters and return state are never proof of access.

## Test ownership boundary

The CLI-managed `test/billing-schema-contract.test.mjs` verifies only the reusable billing contract: account-based ownership, canonical Stripe customer mapping identifiers, shared RPC argument and grant conventions, generated database type alignment, and entitlement-based access. Keep it byte-identical across Core, SnapScreen, and Wakekeeper.

Application product catalogues, application-only tables, RPCs, policies, and entitlement definitions remain developer-owned. Test them in `test/project-billing-schema-contract.test.mjs`, not in the managed shared test. A consumer with that file extends its merge-managed `test:billing-schema` package script to execute both tests, so Core updates can replace the shared assertions without discarding or absorbing product behaviour.

## Checkout and lifecycle

- Stripe Node `22.5.0` and API `2026-07-29.dahlia` are the supported tuple.
- Checkout accepts 1–20 active recurring Prices in one currency and creates flexible-billing-mode subscriptions.
- Omit `payment_method_types` so Stripe Dynamic Payment Methods can select eligible local methods from Dashboard configuration. A product may explicitly restrict methods only through a documented application policy.
- `SC_CONFIG.BILLING` owns Automatic Tax, address collection, and promotion-code switches. Enabling Automatic Tax also requires correct Stripe registrations and product tax codes.
- Checkout metadata carries `supachargerBillingAccountId`; it never treats a user ID as the billing owner.
- The Billing Portal is appropriate for ordinary self-service. Complex seat allocation, organisation membership, multi-subscription changes, quotes, or scheduled transitions belong behind separately authorised application services.
- `SC_CONFIG.BILLING_ACCESS.FEATURE_LOOKUP_KEY` selects entitlement-based access. A `null` key retains the broad “any active/trialling subscription” compatibility policy.

Flexible billing mode is the default for new subscriptions. Before enabling a Stripe feature that is incompatible with flexible mode, document the limitation and add an explicit capability/configuration decision; never silently fall back to classic mode.

## Entitlements

Application access is separate from Price IDs. `app.billing_features`, `app.product_features`, and `app.entitlement_grants` form the access projection. Grants can originate from Stripe Entitlements, an active subscription mapping, an administrator, or a promotion. Runtime authorisation reads the local entitlement projection rather than making a live Stripe call.

`entitlements.active_entitlement_summary.updated` triggers a complete refresh from Stripe's paginated Active Entitlements API. The summary event itself is not assumed to contain every entitlement. Manual and promotional grants must survive a Stripe refresh.

## Durable events and reconciliation

The public webhook route reads the raw body, verifies `stripe-signature`, stores the event and versioned payload durably, acknowledges duplicate IDs, and returns `2xx` after acceptance. `app.stripe_events` provides claims, leases, bounded retry state, and processing status; payloads expire after 30 days by default.

Subscribe only to implemented events:

- `product.created`, `product.updated`, `product.deleted`;
- `price.created`, `price.updated`, `price.deleted`;
- `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed`;
- `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`;
- `customer.subscription.paused`, `customer.subscription.resumed`;
- `entitlements.active_entitlement_summary.updated`.

Stripe events can be duplicated and delivered out of order. Subscription handlers retrieve the current object and atomically replace its complete item set. The processor route uses `STRIPE_EVENT_PROCESSOR_SECRET`. The independently scheduled reconciliation route uses `STRIPE_RECONCILIATION_SECRET`, refreshes every mapped Customer's subscriptions and entitlements, and reports per-Customer failures. Configure both routes in the deployment scheduler.

Do not select all events. Add an event only with a handler, idempotency rule, retry behaviour, fixture, tests, and matching human/agent documentation.

## Database and security

Billing storage lives in the internal `app` schema. Browser access is through narrowly scoped `api` functions. Stripe ingestion and reconciliation use service-only `api_edge` functions. Both schemas have explicit grants; all tables have RLS enabled as defence in depth. Never grant browser roles direct mutation access to projections, Stripe mappings, payment summaries, entitlements, or event payloads.

`app.stripe_customer_mappings` keys mappings by billing account, Stripe account, and live/test mode. `stripe_customer_mapping_id` is the local row UUID; `stripe_customer_id` is Stripe's external `cus_…` identifier. Legacy mappings with unknown mode remain nullable until reconciliation verifies them. Never expose secret/service-role keys, full event payloads, or raw billing records to browser clients or logs.

## Required verification

- Execute both fresh and upgrade migrations; regenerate types from the resulting schema.
- Run database advisors plus explicit `anon`, `authenticated`, and `service_role` grant/RLS tests.
- Test multiple accounts per user, multiple members per account, multiple subscriptions, multiple items, quantities, mixed intervals, and independent cancellation dates.
- Test Dynamic Payment Methods in a Stripe Sandbox, including delayed/async methods where enabled.
- Test duplicate and reverse-order events, processing leases, poison events, replay, entitlement replacement, and scheduled reconciliation.
- Test Customer Portal authorisation so ordinary members cannot open a management session.
- Upgrade SDK, API/event-destination version, fixtures, types, tests, README, Docusaurus, and this guidance together.

Stripe Sync Engine is not the canonical default. Treat it only as a separately approved architecture and security migration. The repository MCP remains descriptive and read-only: it must not receive Stripe secrets, call Stripe, expose records, or apply migrations.
