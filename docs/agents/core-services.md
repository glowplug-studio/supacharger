# Core services

A Core service names a shared capability; the application selects an installed implementation. Core owns the contract and dispatch, while extensions own their implementation, storage and workers.

```ts
PROJECT_NAMESPACE: null,
CORE_SERVICES: {
  auth: { provider: 'supabase' },
  transactional_email: { provider: null },
},
```

`PROJECT_NAMESPACE` in developer-owned `src/supacharger.config.ts` is the optional application prefix intended for generated resource names (for example extension tables, RPCs, workers and secrets). The Core default is `null`: no application prefix has been requested. A supplied value must match `^[a-z][a-z0-9_]{0,19}$`. It is not a Supabase project reference, schema selector, tenant identifier, authentication setting or access-control boundary.

Current Core preparation validates and returns this value, but does not use it to generate or rename database or worker resources. Installed extension SQL and source already contain their deployed names. Do not claim that changing this setting prefixes all Supabase objects. Generators must explicitly consume it and document their resource coverage and `null` behaviour; broad schema namespacing remains separate implementation work.

Before naming new resources, agents and extension authors must read this property and inspect existing migrations and deployed naming conventions. Do not invent a second namespace setting or assume a non-null default. Preserve existing configured values on upgrades. Changing an installed prefix requires an explicit migration and coordinated caller, worker and secret updates; never rewrite applied migrations.

Supabase is the supported authentication implementation. Social providers remain under `SUPABASE_AUTH.OAUTH_PROVIDERS`; password and OTP settings live under `SUPABASE_AUTH.METHODS`. Application transactional email does not alter Supabase Auth email delivery.

## Installed implementations

Set `transactional_email.provider` to an installed extension registry name, such as `supacharger-ext-transactional-email`. A null provider allows Core to build without email. An enabled integration declaring `services: ['transactional_email']` fails preparation clearly when no implementation is available.

`src/supacharger/extensions/prepare.cjs` resolves the implementation selected in application configuration to its standard installed `index.ts` and colocated configuration. It validates those paths and enablement, then generates server-only imports under `src/supacharger.adapters/generated/services/`. It does not read installation receipts or compare file inventories during builds. Register an integration's required capabilities with `services: ['transactional_email']` in `prepareExtensions`. The service entry implements the shared server contract; the database dispatcher validates its private SQL handlers.

SQL installation registers private handlers in `sc_services.bindings`. Trusted database operations invoke `sc_services.call(service_name, operation, input)` inside their business transaction. Bindings are administrator-owned, validate handler signatures and never accept request-selected SQL or module paths. Core has no email queue. Apply the Core service-binding migration before an extension's deployment SQL.

Preparation generates local code only. Applying migrations, setting secrets, deploying workers and enabling dispatch are separate explicit operations. A successful build is not a deployed service readiness check.

## Transactional email contract

Use the server-only `src/supacharger/services/transactional-email.ts` schema and facade. The public message contains a stable UUID `id`, one `to` recipient, optional `replyTo`, and either `{kind: 'template', key, variables}` or `{kind: 'rendered', subject, html?, text?}` with at least one body. Strict runtime validation rejects extra fields and unsupported content before queueing. Product resolver context stays outside the public message.

The selected implementation provides the queue RPC and supported content kinds. The installed service entry exposes `createService(database)` through the generated service module. Use a privileged server database client scoped to `api_edge`; do not expose this facade as an unrestricted browser email endpoint.

The transactional email extension selects its own delivery transport. Brevo API accepts hosted templates; Resend and Mailgun APIs accept hosted or rendered content; SMTP requires rendered content. Delivery credentials and template references are server secrets. Changing transport requires preparation, deployment and an explicit decision for outstanding jobs.

Queue acceptance, provider acceptance and inbox receipt are distinct. Follow the installed implementation's retry, uncertainty and privacy rules. Authentication selection and product-specific recipients remain outside delivery-provider adapters.
