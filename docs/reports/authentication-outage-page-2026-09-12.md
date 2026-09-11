# Authentication outage page — 12 September 2026

Implemented the approved shared outage presentation in Core and synchronised Wakekeeper, SnapScreen and Specdrive. The response uses a centred dark panel, existing local app icon, application name, complete English message and manual original-destination retry. It retains HTTP 503, no-store, retry headers and session state. API and Server Action JSON remains unchanged. The HTML requires no application layout, JavaScript or additional Supabase call. Next.js non-Flight error navigation uses its full-document fallback. No normal Specdrive presentation was replaced.

## Verification

- 26 authentication tests passed in each repository (104 total), including real Proxy branch execution with a stubbed session and request guard, HTML/Flight/API/action/HEAD response selection, retained cookies, cache headers, escaping, CSP style hash and catalogue completeness.
- Focused ESLint passed in all four repositories.
- All three consumer TypeScript checks passed. Specdrive uses `tsc --noEmit` directly because it has no `typecheck` script.
- Core TypeScript reports only the pre-existing missing `ImageUploadErrors` namespace in Spanish and Chinese catalogues at `src/i18n/request.ts:12–13`. The new namespace has empty secondary placeholders where Core's strict catalogue typing requires them.
- Specdrive's English-catalogue check passed; new English keys checked in all four repositories by the authentication tests.
- Bruno parity passed in all four repositories. The shared Bruno outage guidance was reviewed and synchronised; direct PostgREST RPC and Edge Function request bodies, headers, authentication and response contracts remain unchanged. The legacy separately referenced Wakekeeper Bruno checkout is absent from this workspace; available canonical Bruno documentation was updated.
- Shared Proxy, renderer, tests and Bruno README were hash-verified byte-identical across all four repositories. Existing unrelated drift and changes were preserved; Core lock files were not advanced to unpublished work.
- No browser verification was run, following Wakekeeper's instruction requiring an explicit request for browser checks. No builds, deployment or database migration were needed or performed.

## Files changed by this task

### supacharger

- [src/proxy.ts](/Users/jj/Dev/SUPACHARGER_APPS/supacharger/src/proxy.ts)
- [src/supacharger/auth/unavailable-response.ts](/Users/jj/Dev/SUPACHARGER_APPS/supacharger/src/supacharger/auth/unavailable-response.ts)
- [test/auth-proxy-contract.test.mjs](/Users/jj/Dev/SUPACHARGER_APPS/supacharger/test/auth-proxy-contract.test.mjs)
- [messages/en.json](/Users/jj/Dev/SUPACHARGER_APPS/supacharger/messages/en.json)
- [README.md](/Users/jj/Dev/SUPACHARGER_APPS/supacharger/README.md)
- [docs/agents/authentication-and-claims.md](/Users/jj/Dev/SUPACHARGER_APPS/supacharger/docs/agents/authentication-and-claims.md)
- [docs/bruno/supacharger-rpc/README.md](/Users/jj/Dev/SUPACHARGER_APPS/supacharger/docs/bruno/supacharger-rpc/README.md)
- [messages/es.json](/Users/jj/Dev/SUPACHARGER_APPS/supacharger/messages/es.json)
- [messages/zh.json](/Users/jj/Dev/SUPACHARGER_APPS/supacharger/messages/zh.json)
- [tools/supacharger-mcp/README.md](/Users/jj/Dev/SUPACHARGER_APPS/supacharger/tools/supacharger-mcp/README.md)

### wakekeeper-spacharger-app

- [src/proxy.ts](/Users/jj/Dev/SUPACHARGER_APPS/wakekeeper-spacharger-app/src/proxy.ts)
- [src/supacharger/auth/unavailable-response.ts](/Users/jj/Dev/SUPACHARGER_APPS/wakekeeper-spacharger-app/src/supacharger/auth/unavailable-response.ts)
- [test/auth-proxy-contract.test.mjs](/Users/jj/Dev/SUPACHARGER_APPS/wakekeeper-spacharger-app/test/auth-proxy-contract.test.mjs)
- [messages/en.json](/Users/jj/Dev/SUPACHARGER_APPS/wakekeeper-spacharger-app/messages/en.json)
- [README.md](/Users/jj/Dev/SUPACHARGER_APPS/wakekeeper-spacharger-app/README.md)
- [docs/agents/authentication-and-claims.md](/Users/jj/Dev/SUPACHARGER_APPS/wakekeeper-spacharger-app/docs/agents/authentication-and-claims.md)
- [docs/bruno/supacharger-rpc/README.md](/Users/jj/Dev/SUPACHARGER_APPS/wakekeeper-spacharger-app/docs/bruno/supacharger-rpc/README.md)

### snapscreen-supacharger-app

- [src/proxy.ts](/Users/jj/Dev/SUPACHARGER_APPS/snapscreen-supacharger-app/src/proxy.ts)
- [src/supacharger/auth/unavailable-response.ts](/Users/jj/Dev/SUPACHARGER_APPS/snapscreen-supacharger-app/src/supacharger/auth/unavailable-response.ts)
- [test/auth-proxy-contract.test.mjs](/Users/jj/Dev/SUPACHARGER_APPS/snapscreen-supacharger-app/test/auth-proxy-contract.test.mjs)
- [messages/en.json](/Users/jj/Dev/SUPACHARGER_APPS/snapscreen-supacharger-app/messages/en.json)
- [README.md](/Users/jj/Dev/SUPACHARGER_APPS/snapscreen-supacharger-app/README.md)
- [docs/agents/authentication-and-claims.md](/Users/jj/Dev/SUPACHARGER_APPS/snapscreen-supacharger-app/docs/agents/authentication-and-claims.md)
- [docs/bruno/supacharger-rpc/README.md](/Users/jj/Dev/SUPACHARGER_APPS/snapscreen-supacharger-app/docs/bruno/supacharger-rpc/README.md)

### specdrive-supacharger-app

- [src/proxy.ts](/Users/jj/Dev/SUPACHARGER_APPS/specdrive-supacharger-app/src/proxy.ts)
- [src/supacharger/auth/unavailable-response.ts](/Users/jj/Dev/SUPACHARGER_APPS/specdrive-supacharger-app/src/supacharger/auth/unavailable-response.ts)
- [test/auth-proxy-contract.test.mjs](/Users/jj/Dev/SUPACHARGER_APPS/specdrive-supacharger-app/test/auth-proxy-contract.test.mjs)
- [messages/en.json](/Users/jj/Dev/SUPACHARGER_APPS/specdrive-supacharger-app/messages/en.json)
- [README.md](/Users/jj/Dev/SUPACHARGER_APPS/specdrive-supacharger-app/README.md)
- [docs/agents/authentication-and-claims.md](/Users/jj/Dev/SUPACHARGER_APPS/specdrive-supacharger-app/docs/agents/authentication-and-claims.md)
- [docs/bruno/supacharger-rpc/README.md](/Users/jj/Dev/SUPACHARGER_APPS/specdrive-supacharger-app/docs/bruno/supacharger-rpc/README.md)
- [docs/api/supabase-rpc.openapi.yaml](/Users/jj/Dev/SUPACHARGER_APPS/specdrive-supacharger-app/docs/api/supabase-rpc.openapi.yaml)

### supacharger-docs

- [Authentication documentation](</Users/jj/Dev/SUPACHARGER_APPS/supacharger-docs/docs/Application Development/authentication.md>)

This report is stored at `supacharger/docs/reports/authentication-outage-page-2026-09-12.md`.
