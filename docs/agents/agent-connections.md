# Agent connections contract

## Ownership

Core owns the generic organisation-scoped OAuth connection. Products own the
capabilities and narrower resource binding made available to that connection.
Do not name reusable contracts after one product, MCP server, or agent host.

`app.agent_connections` stores the organisation, authorising user, OAuth client
metadata, scopes and lifecycle timestamps. It never stores access tokens or
refresh tokens. `supacharger_agent` is `NOLOGIN NOINHERIT` and receives only the
private resolver/touch helpers plus product functions granted explicitly in a
reviewed forward migration.

## Complete source map

```text
supabase/migrations/20260826050719_add_agent_connections.sql
src/supacharger/agents/
src/app/(supacharger)/auth/oauth/consent/
src/app/(supacharger)/(authenticated)/account/agents/
src/app/(supacharger)/(authenticated)/[handle]/settings/agents/
src/supacharger.adapters/agents/
src/styles/supacharger-agents.css
src/supacharger.config.ts
test/agent-connections-contract.test.mjs
docs/api/supabase-rpc.openapi.yaml
docs/bruno/supacharger-rpc/agent_connections.bru
```

The first five implementation paths and the shared contract test are
CLI-managed. The adapter directory, configuration values and stylesheet are
developer-owned preserved seams. Migrations are forward-only; an application
with incompatible existing schema uses an audited migration alias.

## Consent and lifecycle

`AGENT_CONNECTIONS.ENABLED` gates the managed routes. The database independently
checks `app.agent_connections_enabled()`. Product migrations replace that
default-false function only when the product is ready.

Consent creates the Core connection and calls `app.agent_connection_extension`
in one transaction before approving the Supabase authorisation request. A
product must re-authorise every extension input. Approval failure revokes and
deletes the application connection.

Users see and manage their own connections under Account → Agents.
Organisation owners and administrators see every organisation connection under
Organisation Settings → Agents; ordinary members still see only their own. All
may revoke/delete the sessions visible to them. Own-user revocation also calls
Supabase Auth `oauth.revokeGrant()`. Administrator revocation intentionally
stops at the database boundary because it must not imply cross-user platform
Auth authority.

## Claims and product calls

When `client_id` is present, `app.custom_access_token_hook` emits
`role=supacharger_agent` and removes human global/active-organisation claims.
Product RPCs call `app.resolve_agent_connections()` and then enforce their own
resource membership on every operation. Revocation, client mismatch, user
mismatch or removed organisation membership therefore blocks the next call.

Hosted OAuth Server enablement and the Custom Access Token Hook selection are
deployment settings. They must be verified independently of `supabase/config.toml`.

## Presentation

Managed JSX uses only semantic `sc-agent-*` class names. Every layout, spacing,
typography, colour, border, responsive state, focus state and loading animation
belongs in preserved `src/styles/supacharger-agents.css` using Tailwind
`@apply`. Do not reintroduce utility classes into managed agent JSX.
