# Supacharger repository MCP

This read-only local MCP gives coding agents a durable understanding of the Supacharger core mission, ownership model, project structure, and promotion workflow.

## Run

```bash
npm install
npm start
```

The server uses stdio and is registered for Codex by the repository's `.codex/config.toml`.

## Capabilities

- Read curated mission, ownership, localisation, authentication, profile/onboarding, database, billing, workflow, and agent guidance resources.
- Classify repository paths before editing them.
- Render a filtered project tree.
- Search curated guidance without exposing environment files.

The ownership guidance includes the styling contract: `src/supacharger/styles/` is CLI-managed, while `src/styles/project.css` is the named application's developer-owned styling seam and must survive core updates. Agents can retrieve the full rules through the `ownership` guidance resource or classify either path directly.

The MCP is descriptive and read-only. It does not supersede `AGENTS.md`, edit files, run migrations, or access sibling applications.

The localisation resource records the locale-neutral routing contract, the transient `?lang=<two-letter-code>` marketing handoff, profile persistence in `app.profiles.language_code`, and the precedence used to restore a preference. It also identifies `src/i18n/` plus `messages/` as developer-owned paths that the CLI must preserve.

The database and profile resources record the one-profile-per-Auth-user model, three-state username policy, post-sign-in onboarding guard, dormant organisation schema, private `user-avatars` paths, safe identity fallback/general projection, and `app`/`api`/`api_edge` schema boundary.

The authentication resource records the one-client/one-verification Proxy contract, response cookie and anti-cache-header invariant, strict-mode option, anonymous-user policy, configured password/magic-link/OTP journey, SnapScreen-based shared presentation contract, private global-role source, custom access-token hook, JWT freshness limitations, and organisation-context boundary. The mobile-auth resource records the developer-owned native identifiers, generated iOS and Android association endpoints, PKCE client boundary, Proxy bypass, callback validation, and platform verification requirements.

The workflow resource also records the Supacharger-only Bruno parity rule. Client-callable `api` RPC changes must update `docs/bruno/supacharger-rpc/` and pass `npm run check:bruno-rpcs`; consumer-specific RPCs do not belong in the core collection.

The billing resource records the billing-account domain, multi-subscription and multi-item projection, entitlement boundary, Dynamic Payment Methods, flexible billing mode, schema ownership, durable event/reconciliation contract, required event list, secrets, and verification rules. It is descriptive only and cannot access Stripe, read secrets, or apply migrations.
