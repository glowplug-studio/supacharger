# Core services

A Core service names a shared capability; the application selects an installed implementation. Core owns the contract and dispatch, while extensions own their implementation, storage and workers.

```ts
PROJECT_NAMESPACE: '',
CORE_SERVICES: {
  auth: { provider: 'supabase' },
  transactional_email: { provider: null },
},
```

`PROJECT_NAMESPACE` in developer-owned `src/supacharger.config.ts` is the installation code. Empty selects `sc_`; `wake` selects `sc_wake_`. Non-empty values must match `^[a-z][a-z0-9_]{0,5}$`. Choose it before installing database resources and preserve it on updates. See [Database and resource namespaces](database-namespaces.md) for runtime helpers, SQL, Edge preparation and existing-installation cutovers.

Supabase is the supported authentication implementation. Social providers remain under `SUPABASE_AUTH.OAUTH_PROVIDERS`; password and OTP settings live under `SUPABASE_AUTH.METHODS`. Application transactional email does not alter Supabase Auth email delivery.

## Installed implementations

Set `transactional_email.provider` to an installed extension registry name, such as `supacharger-ext-transactional-email`. A null provider allows Core to build without email. An enabled integration declaring `services: ['transactional_email']` fails preparation clearly when no implementation is available.

`src/supacharger/extensions/prepare.cjs` resolves the implementation selected in application configuration to its standard installed `index.ts` and colocated configuration. It validates those paths and enablement, then generates server-only imports under `src/supacharger.adapters/generated/services/`. It does not read installation receipts or compare file inventories during builds. Register an integration's required capabilities with `services: ['transactional_email']` in `prepareExtensions`. The service entry implements the shared server contract; the database dispatcher validates its private SQL handlers.

SQL installation registers private handlers in the resolved services schema's `bindings` table. With an empty project code this is `sc_services.bindings`; with `wake` it is `sc_wake_services.bindings`. Trusted database operations invoke that schema's `call(service_name, operation, input)` inside their business transaction. Bindings are administrator-owned, validate handler signatures and never accept request-selected SQL or module paths. Core has no email queue. Apply the Core service-binding migration before an extension's deployment SQL.

Preparation generates local code only. Applying migrations, setting secrets, deploying workers and enabling dispatch are separate explicit operations. A successful build is not a deployed service readiness check.

## Transactional email contract

Use the server-only `src/supacharger/services/transactional-email.ts` schema and facade. The public message contains a stable UUID `id`, one `to` recipient, optional `replyTo`, and either `{kind: 'template', key, variables}` or `{kind: 'rendered', subject, html?, text?}` with at least one body. Strict runtime validation rejects extra fields and unsupported content before queueing. Product resolver context stays outside the public message.

The selected implementation provides the queue RPC and supported content kinds. The current transactional-email entry re-exports `createTransactionalEmailService(database, binding)` through the generated service module; the trusted binding supplies `enqueueRpc` and `contentKinds`. Use a privileged server database client scoped to the resolved `api_edge` schema; do not expose this facade as an unrestricted browser email endpoint.

The transactional email extension selects its own delivery transport. Brevo API accepts hosted templates; Resend and Mailgun APIs accept hosted or rendered content; SMTP requires rendered content. Delivery credentials and template references are server secrets. Changing transport requires preparation, deployment and an explicit decision for outstanding jobs.

Queue acceptance, provider acceptance and inbox receipt are distinct. Follow the installed implementation's retry, uncertainty and privacy rules. Authentication selection and product-specific recipients remain outside delivery-provider adapters.

## Developing extensions with database operations

A binding is a registration saying which extension's PostgreSQL function handles a named operation. Core creates the `bindings` table and `call` dispatcher; the selected extension's installation SQL registers its own functions. The table is not a list of all installed extensions, a message queue, an HTTP endpoint registry or a secret store. Do not create a registration for an extension merely because it is installed.

Use this mechanism when another database function needs to invoke an extension operation within its transaction. Application-only and Edge-only integrations can call their configured code directly. An extension that sends messages or generates documents can register a function that queues work, then perform external API calls in its worker. External delivery is not part of the PostgreSQL transaction and cannot be rolled back with it. The extension owns any queue, validation, authorisation, retry policy and worker; Core registration supplies none of those automatically.

### Resolve names and define the contract

Read `PROJECT_NAMESPACE` only from developer-owned `src/supacharger.config.ts`. Use Core's `resourceName(namespace, 'services')` for the registration schema and `resourceName(namespace, 'ext_<id>')` for extension-owned schemas. Render concrete names into reviewed installation SQL before applying it. Do not hard-code Wakekeeper's prefix, introduce another prefix setting or rewrite installed migrations. See [database namespaces](database-namespaces.md).

The application selects its service extension through `CORE_SERVICES`; the extension's configuration selects its own transport where applicable. Adding a new shared service name requires a Core contract change, configuration/preparation support and documentation. An arbitrary new row alone does not implement a supported Core service.

Agree the operation's JSON input, JSON result, permissions and failure behaviour before registering it. The current dispatcher accepts an ordinary PostgreSQL function taking exactly one `jsonb` argument and returning one `jsonb` value, with no default or variadic arguments and no set-returning result. Its signature check does not validate the JSON structure or business permissions: the handler and its trusted callers must do that. Keep handlers in private schemas, outside `public` and all exposed API schemas, including their resolved names. Verify the deployed dispatcher and exposure settings rather than assuming a pending migration is applied.

### Register and call a handler

The columns have these meanings:

| Column | Meaning |
| --- | --- |
| `binding_id` | Generated identifier for the registration row. |
| `service_name` | Shared capability, currently for example `transactional_email`. |
| `operation` | Operation within that capability, for example `enqueue_context`. |
| `implementation` | Owning extension's registry name, for example `supacharger-ext-transactional-email`. |
| `contract_version` | Operation contract version; the current implementation supports `1`. |
| `handler` | Exact database function reference, stored as `regprocedure`, including its argument types. |

Only one handler can be selected for each `(service_name, operation)` pair. Create the private function before registering it. A registration identifies a PostgreSQL function, not an Edge Function URL or an external provider such as Brevo.

Installation SQL may insert the registration or deliberately update the existing pair after checking its current owner. Do not blindly overwrite another selected extension. Resolve the handler using its fully qualified name and `(jsonb)` signature. Apply the handler and registration changes together in a reviewed transaction, then read back the registration and verify its resolved function and permissions.

Trusted SQL callers invoke the resolved services schema's `call` function with the agreed service name, operation and JSON input. Keep service/operation selection controlled by trusted code; do not expose the dispatcher as an unrestricted browser RPC or accept arbitrary handler names from requests. Core revokes table access and dispatcher execution from `PUBLIC`, `anon`, `authenticated` and `service_role`; preserve that private boundary. Do not grant general access just to make an integration work. The dispatcher is `SECURITY DEFINER`, so review the authority exercised by every registered handler and validate the caller at the authorised entry point.

### Change a provider or remove an extension

Changing Brevo to another transport inside the same transactional-email extension normally keeps the same SQL registrations. Reprepare and deploy the worker, update credentials and database settings as required by that extension, and decide explicitly how to handle outstanding jobs. Do not infer permission to replay messages.

Replacing the service extension requires installing compatible replacement handlers and deliberately switching the affected registrations, application configuration and prepared code. Verify the replacement before retiring the previous implementation. Dropping and recreating a handler can change its database identity: verify or refresh its `regprocedure` registration rather than assuming a matching textual name is sufficient.

Before unregistering an extension, identify its dependent callers and pending work. Switch those callers to a replacement or explicitly disable the dependent feature first. Delete only registrations owned by the intended extension, scoped to the reviewed service/operations; never truncate Core's registration table. Read back the result. A missing registration makes `call` raise an error and can roll back its caller's transaction; deleting a row is not a graceful feature-disable mechanism.

Unregistering does not delete queues, application data, workers, secrets or source files. Treat their retention/removal as separate explicit actions. The current CLI has no database-uninstall command: file removal or frontend `enabled: false` does not unregister anything. An extension may document reviewed teardown SQL, but do not claim an automatic uninstall hook exists or execute teardown during builds. Keep installation and lifecycle changes in forward migrations and verify them before reporting completion.

### Verification for extension authors

Check the resolved schema names, selected extension, registration rows, exact handler signatures, privileges and configured API exposure. Verify authorised success, invalid input, unauthorised access, missing-service failure and transaction rollback using appropriate existing checks or an approved disposable database. For queued operations, distinguish queue acceptance from external completion and verify pending-job handling separately. Never send email, call a paid API or retry real jobs merely to prove registration works without the required authorisation.
