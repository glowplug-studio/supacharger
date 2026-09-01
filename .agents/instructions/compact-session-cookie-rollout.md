# Compact session-cookie rollout

## Decision

Promote compact Supabase SSR session cookies into Supacharger Core. Every browser, server, and Proxy client must use `cookies.encode: 'tokens-only'` so refresh-token rotation cannot expand the shared Auth cookie with the complete Auth user object.

## Implementation order

1. Add `src/lib/supabase/client.ts` and `src/lib/supabase/server.ts` to the exact managed-path contract.
2. Apply `tokens-only` consistently in those clients and `src/lib/supabase/supacharger/proxy.ts`.
3. Extend the managed authentication and tooling tests to prevent encoding drift.
4. Update the Core README, Docusaurus authentication guide, and agent/MCP authentication resources.
5. Copy every changed managed path byte-identically to Wakekeeper, SnapScreen, and Specdrive without touching product-owned work.
6. Run focused Auth, tooling, type and managed-file hash checks in Core and every consumer.
7. Commit Core, Docusaurus, and each consumer separately.

## Compatibility and deployment

- Server code must use `getClaims()` for verified claims or `getUser()` for a fresh Auth record; it must not rely on `getSession().user`.
- Browser clients retain the user object in their separate browser storage while cookies carry only access and refresh token state.
- Existing larger cookies compact on the next session write or refresh. Users with invalid or already rejected refresh tokens may still need to sign in again.
- This change does not alter PostgreSQL, Supabase Auth schema, RPCs, migrations, JWT expiry, refresh-token rotation, or hosted Auth timeout settings. No database migration is required or eligible for deployment.
