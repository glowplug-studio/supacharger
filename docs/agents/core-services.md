# Core services

A Core service names a shared capability; the application selects an installed implementation. Core owns the contract and dispatch, while extensions own their implementation, storage and workers.

```ts
PROJECT_NAMESPACE: 'my_application',
CORE_SERVICES: {
  auth: { provider: 'supabase' },
  transactional_email: { provider: null },
},
```

`PROJECT_NAMESPACE` is a stable deployment identifier: 1–20 lowercase letters, digits or underscores, starting with a letter. It is not a display name or Supabase project reference. Review generated SQL, worker and secret names before deployment; changing an installed namespace requires an explicit migration.

Supabase is the supported authentication implementation. Social providers remain under `AUTH_PROVDERS_ENABLED`; password and OTP settings remain under `AUTHENTICATION`. Application transactional email does not alter Supabase Auth email delivery.

## Installed implementations

Set `transactional_email.provider` to an installed extension registry name, such as `supacharger-ext-transactional-email`. A null provider allows Core to build without email. An enabled extension declaring `core_services: ['transactional_email']` fails preparation clearly when no implementation is available.

`src/supacharger/extensions/prepare.cjs` resolves service providers through installed manifest descriptors, validates paths and managed-file hashes, and generates server-only imports under `src/supacharger.adapters/generated/services/`. It does not maintain a hard-coded provider list or execute configuration files. A third-party implementation supplies `provides_services.transactional_email` with `contractVersion: 1`, a manifest-listed `server` entry and `database: {schema: 'api_edge', enqueueRpc: '<installed_rpc>'}`.

SQL installation registers private handlers in `sc_services.bindings`. Trusted database operations invoke `sc_services.call(service_name, operation, input)` inside their business transaction. Bindings are administrator-owned, validate handler signatures and never accept request-selected SQL or module paths. Core has no email queue. Apply the Core service-binding migration before an extension's deployment SQL.

Preparation generates local code only. Applying migrations, setting secrets, deploying workers and enabling dispatch are separate explicit operations. A successful build is not a deployed service readiness check.

## Transactional email contract

Use the server-only `src/supacharger/services/transactional-email.ts` schema and facade. The public message contains a stable UUID `id`, one `to` recipient, optional `replyTo`, and either `{kind: 'template', key, variables}` or `{kind: 'rendered', subject, html?, text?}` with at least one body. Strict runtime validation rejects extra fields and unsupported content before queueing. Product resolver context stays outside the public message.

The selected implementation provides the queue RPC and supported content kinds. The installed service entry exposes `createService(database)` through the generated service module. Use a privileged server database client scoped to `api_edge`; do not expose this facade as an unrestricted browser email endpoint.

The transactional email extension selects its own delivery transport. Brevo API accepts hosted templates; Resend and Mailgun APIs accept hosted or rendered content; SMTP requires rendered content. Delivery credentials and template references are server secrets. Changing transport requires preparation, deployment and an explicit decision for outstanding jobs.

Queue acceptance, provider acceptance and inbox receipt are distinct. Follow the installed implementation's retry, uncertainty and privacy rules. Authentication selection and product-specific recipients remain outside delivery-provider adapters.
