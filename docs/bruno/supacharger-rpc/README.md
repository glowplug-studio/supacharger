# Supacharger RPC Bruno collection

This collection documents and exercises the canonical client-callable RPCs in Supacharger's `api` schema. Set `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, and a signed-in user's `SUPABASE_ACCESS_TOKEN` in a local Bruno environment before running authenticated requests.

The collection and parity checker are exact CLI-managed Core assets. Managed consumers receive byte-identical copies. Do not add Specdrive, SnapScreen, Wakekeeper, or other consumer-specific RPCs here. Promote a reusable database contract into Supacharger before documenting it in this collection.

Run `npm run check:bruno-rpcs` whenever migrations change. In Core, the check requires one request for every current `api` RPC and rejects stale requests. In a managed consumer, it requires every canonical Supacharger RPC while allowing extra product-owned RPCs. Server-only `api_edge` functions are intentionally excluded because they require privileged credentials and mutate internal Stripe projections; their contracts remain documented in migrations and server code without placing secret-key workflows in the client RPC collection.

## Refresh contention and outage containment

Server Components share a Supabase client through React's request-scoped `cache`.
Never replace this with a module-global authenticated client: that would mix users.
Proxy has its own client and still verifies claims exactly once. Cookie propagation
remains authoritative between Proxy, rendering and the browser; the implementation
does not assume that Proxy and rendering share a process.

`src/lib/supabase/supacharger/refresh-transport.ts` coordinates only server-side
`POST /auth/v1/token?grant_type=refresh_token` calls. A SHA-256 digest of the project
endpoint, API key and refresh token identifies a flight; raw keys/tokens are never
logged or used as map keys. Successful token-bearing responses are retained in
server memory for ten seconds to serve simultaneous/stale requests, then discarded.
Every caller receives an independent Response and applies its own rotated cookies.
There are at most eight upstream refreshes in flight, 60 new refreshes per minute,
and 256 retained entries per runtime. Each upstream refresh has a five-second
network deadline. Different projects, API keys and refresh tokens never share results.

HTTP 409 contention gets a 30-second credential-specific cooldown. HTTP 429, 5xx
and network failures also open a 30-second runtime circuit for new refreshes.
Temporary failures are represented internally as a safe SDK error without triggering
its nested 5xx retry loop. They suppress SDK cookie clearing: an outage is not proof
of logout. Proxy terminates with HTTP 503, `Retry-After: 30` and private/no-store
cache headers before authentication redirects or page rendering. Clients must honour
that delay; never immediately reload or repeat the protected request in a loop.
Permanent invalid-token responses retain normal SDK session-removal behaviour.
Other endpoints, including password login, logout and RPCs, are unchanged.

Browser page requests receive a standalone, centred dark recovery panel with the
application name, its local `/favicons/apple-touch-icon.png`, an English connection
message and a **Try again** link. The link retries the original path and query,
omitting Next.js's internal `_rsc` parameter. There is no automatic reload, script,
remote font, application layout or additional Supabase call. Next.js client-side
Flight navigation falls back to a full document request for this non-Flight 503.
API paths, Server Actions and other non-document requests retain
`{"error":"auth_temporarily_unavailable"}`. Session cookies survive and every
variant remains private/no-store with `Retry-After: 30`. The `ServiceUnavailable`
namespace in developer-owned `messages/en.json` supplies the copy, with protected
English defaults for stale catalogues. This emergency response deliberately uses
English without profile or locale lookups. Secondary languages remain untranslated;
empty placeholders are added only where catalogue type parity requires them.
This covers temporary Auth refresh failures detected by Proxy, not every possible
Supabase database or downstream service failure.

`isLoggedIn()` is a passive presentation check. It extracts the bounded access token
from this project's SSR cookie and explicitly passes it to `getClaims(token)` for
signature/expiry verification. It does not refresh; missing, malformed or expired
tokens produce signed-out presentation. The cookie alone never authorises access.
With symmetric signing keys, verification can still call Auth. Protected handlers,
current membership checks and RLS remain authoritative.

These are runtime-local safeguards, not a distributed lock, shared rate limiter or
DDoS guarantee. Proxy, render workers, replicas and cold starts can have separate
coordinators. Put a trusted-IP rate limit/WAF at the hosting perimeter for dynamic
and authentication routes, and retain Supabase Auth's own token-endpoint limits for
direct calls to the Supabase hostname. A site WAF cannot intercept those direct calls.
Review server egress-IP aggregation before lowering Auth quotas; do not forward
untrusted client IP headers or put secret/service-role keys in browser clients.
A deployment needing strict cross-replica coalescing requires a separately operated
shared coordinator with bounded credential storage. No such infrastructure is
silently installed by Core. No database migration or hosted setting change is
required for this code update; deploy every consumer and restart existing workers.
