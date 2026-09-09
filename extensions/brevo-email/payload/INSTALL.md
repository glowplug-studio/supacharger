# Brevo reliable delivery extension — 2.0.0

This optional extension owns durable delivery, immediate post-commit dispatch, a private worker and minute retries. No Core runtime registry, Vercel cron or marketing automation is installed.

## Install and activate

1. Use the updated manifest-v2 CLI: `supacharger extension install brevo-email --source /path/to/bundle --plan`, then repeat without `--plan`.
2. Review/apply `supabase/migrations/20260910120000_ext_brevo_email_delivery.sql`. It enables pg_net, pg_cron and Vault; creates private brevo_email storage and service-only api_edge RPCs; and registers ext-brevo-email-retry. Expose api_edge through PostgREST, never brevo_email.
3. Set Edge secrets BREVO_API_KEY, BREVO_EMAIL_WORKER_SECRET (random, at least 32 characters), and BREVO_TEMPLATE_<TEMPLATE_KEY> for each numeric template ID. Optional BREVO_API_KEY_ENV selects an existing credential environment name. Supabase supplies SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.
4. Deploy `ext-brevo-email --no-verify-jwt` using the Supabase CLI. Its handler verifies the dedicated secret before privileged work. User JWTs cannot authorise it.
5. After verification, configure Vault secrets brevo_email_worker_url (`https://<project-ref>.supabase.co/functions/v1/ext-brevo-email`) and brevo_email_worker_secret (same dedicated secret). This activates real delivery, including pending notifications. Keep secrets out of migrations, CLI arguments, logs and Git. Custom/local worker URLs need a separately reviewed endpoint policy.
6. Verify an authorised test notification. The worker's check command checks basic environment presence, not key validity, template activation, database readiness or delivery. Doctor checks installed file hashes only.

The installer copies files. It never applies SQL, modifies Supabase configuration, deploys, sets secrets or executes package scripts.

## Pass props from trusted application code

Import sendBrevoEmails from the installed delivery.ts and use a service client scoped to api_edge:

```ts
await sendBrevoEmails(serviceClient.schema('api_edge'), [{
  id: notificationId, // stable UUID: reuse for this notification
  template: 'WELCOME', // worker reads BREVO_TEMPLATE_WELCOME
  to: { email: authorisedAccountEmail, name: authorisedDisplayName },
  params: { first_name: authorisedDisplayName },
}]);
```

Validate and authorise the application action first. Never pass browser-provided recipients or template selections blindly. One notification has one recipient, preventing address disclosure. Calls accept 1–1000 notifications, each up to 100 KB of JSON. Returned recorded IDs mean durable acceptance, not provider acceptance or inbox delivery.

For atomic business events, call `brevo_email.enqueue(notifications jsonb)` inside the trusted product SQL transaction instead. This uses the same delivery table. The insert immediately registers targeted worker requests, in batches of 20; pg_net starts them after commit without waiting for cron. A 1000-recipient insert dispatches all 50 batches immediately. Very large bursts need application/provider rate planning.

Cron recovers due failed, unattempted or interrupted notifications, up to 20 per minute. Success rows remain as an audit/idempotency ledger and are excluded from retries. Shared leases prevent overlapping claims; backoff grows to one hour. No automatic deletion or retry cutoff is installed: monitor old pending rows and choose retention/suppression policies explicitly.

Provider acceptance is not inbox delivery. Brevo's 30-minute idempotency window cannot guarantee exactly-once delivery across long acknowledgement outages. Timeouts can mean uncertain acceptance; retries reuse the same ID. Reusing an ID with different content is rejected.

## Optional bulk privacy refresh

Most apps supply final to/params snapshots. Apps needing current privacy/account data can register an administrator-owned jsonb-to-jsonb SQL resolver in brevo_email.resolvers for a template. It receives up to 20 notifications and must return every original ID/template exactly once with refreshed to/params. Optional metadata holds product UUIDs. Browser/service roles cannot modify this registry. Resolve shared records once per batch and fail closed on missing identities.

Wakekeeper uses this seam for account emails and host privacy. Product queries stay outside extension-managed code. Stored snapshot parameters otherwise remain unchanged on retries.

## Worker API and ownership

POST accepts only `{"action":"check"}` or `{"action":"process","ids":["notification-uuid"]}`; omit ids for a retry batch. Maximum body: 2048 bytes; maximum IDs: 20. No HTTP-supplied recipients, templates, HTML or RPC names. Bearer BREVO_EMAIL_WORKER_SECRET is required. Statuses: 200 success, 400 invalid command, 401 unauthorised, 405 method, 413 size, 415 content type, 503 configuration/claim/delivery failure. A process response reports sent/failed when a batch was processed.

Manifest v2 installs extension-scoped modules, supabase/functions/ext-brevo-email, instructions and namespaced forward migrations. It never rewrites an installed migration; timestamp collisions stop installation. Core locks remain unchanged. Keep installed source identical to manifest hashes.

The v1 createBrevoTemplateSender remains available as a low-level transport with reply-to/tags. Existing consumers must explicitly migrate queues, preserving IDs, successes and leases, and disable old claimers before activation. Retain migration history. Disable scheduling/dispatch before retiring the extension; preserve unresolved deliveries.

Agents must report installation, integration, configuration, deployment and delivery verification separately. Specdrive token purchases/downloads remain deferred.

References: [post-commit pg_net](https://supabase.com/docs/guides/database/extensions/pg_net), [Cron and Vault](https://supabase.com/docs/guides/functions/schedule-functions), [Brevo API](https://developers.brevo.com/reference/send-transac-email).
