# Authentication, Proxy, roles, and custom claims

## Authenticator assurance

Managed Supabase Auth TOTP enrolment and factor management are always available at `/account/security`; there is no application visibility flag. `AUTHENTICATION.MFA_TOTP.REQUIRED_FOR_SIGN_IN` checks `getAuthenticatorAssuranceLevel()` after password and email-OTP sign-in and in the OAuth/PKCE callback. An enrolled AAL1 session is sent to the managed `/account/mfa` challenge with only an allowlisted relative `next` path. Challenge success raises the session to AAL2 before navigation resumes. Local projects must enable both `auth.mfa.totp.enroll_enabled` and `verify_enabled` in `supabase/config.toml` and restart the local stack. Hosted Auth capability remains a separate Dashboard setting.

Use Supabase Auth factors only: list, enrol, challenge/verify, and unenrol. Never create an application MFA table or persist the TOTP secret. Treat unverified factors as incomplete enrolments, allow cancellation, and require a fresh code for factor removal when the session must step up. `REQUIRED_FOR_SIGN_IN` cannot manufacture a factor; a user with no verified factor has no AAL2 challenge until enrolment.

## Cross-device session transfer

`AUTHENTICATION.CROSS_DEVICE_SESSION_TRANSFER` is disabled by default. Its TTL must be an integer from 60 through 300 seconds; use 120 unless a product has an approved reason to shorten it. `POST /api/auth/session-transfers` remains protected and accepts only strict JSON with an optional safe relative `next`. `/auth/session-transfer` and `POST /api/auth/session-transfers/redeem` are public protocol routes so an unauthenticated receiving browser can redeem; both return `404` while disabled.

Issue requires a verified, non-anonymous user, a confirmed email, a live `session_id`, same-origin mutation headers and AAL2 when the configured MFA policy requires it for an enrolled account. Store only a SHA-256 digest of the 256-bit base64url grant. The URL carries the raw grant in its fragment; the minimal bootstrap clears it before a single credentialled POST and loads no analytics or third-party resources.

Claim is atomic and one-use. The trusted server fetches the known user, creates an unsent Supabase magic-link token, verifies it immediately through the request-scoped SSR client, checks the exact user ID, and never returns or persists the generated Auth token properties. This creates a distinct AAL1 receiving session. Route success through the existing callback adapter so MFA, onboarding, billing and the stored destination remain canonical. A receiving session for another user fails closed; the same user continues without minting another session. Never copy source access or rotating refresh tokens.

Email and password settings are separate from profile details. Their managed server routes authenticate with `getUser()`, validate payloads with Zod, and reauthenticate the current password before `updateUser`. OAuth-only accounts must show password-dependent controls as unavailable.

## Proxy contract

`src/lib/supabase/client.ts`, `src/lib/supabase/server.ts`, `src/proxy.ts`, and `src/lib/supabase/supacharger/proxy.ts` are shared core behaviour distributed by the CLI. Keep `cookies.encode: 'tokens-only'` byte-identical across the browser, server, and Proxy clients. This stores the browser-side user object separately while keeping only token state in shared cookies, preventing a refresh from expanding request headers with a duplicate Auth user record. Server code must use `getClaims()` for verified claims or `getUser()` for a fresh Auth record; `getSession()` is only for raw token state and its `user` field must not be used. Create one request-scoped Supabase server client and perform exactly one `getClaims()` identity check in Proxy. Exclude `is_anonymous` identities unless `ALLOW_ANONYMOUS_USERS` is true. The managed Proxy and session adapter must not perform profile, onboarding, billing or organisation lookups. The developer-owned project request guard may perform a narrowly scoped availability lookup after authentication routing, using the existing verified client; see Project request guard below.

Use `src/supacharger/auth/server-access.ts` from protected server layouts and handlers. `requireVerifiedUser()` performs no profile or billing RPC, `requireOnboardedUser()` applies the configured profile-completion policy without a billing RPC, and `requireAppAccess()` applies onboarding first and then configured billing access. `readAppAccessState()` exposes the same ordered state for server consumers. These checks are authoritative navigation boundaries but do not replace handler-specific authorisation, grants, or RLS.

Recovery destinations must sit outside the guard they recover: profile setup belongs under a verified-only layout, billing acquisition under an onboarded layout, and full product routes under `requireAppAccess()`. Use route groups to preserve public URLs. Do not add pathname exceptions to the generic access helpers.

Whenever `@supabase/ssr` changes auth cookies, preserve the mutated request cookies, response cookies, and its `Cache-Control`, `Expires`, and `Pragma` headers on every continuation, redirect, rewrite, and error response. Use `src/supacharger/auth/proxy-response.ts` and its `copySupabaseResponseState`; do not create a replacement response that drops this state.

Before creating the request-scoped Auth client, remove known password, email, MFA, and organisation-registration fields from query strings on `/account` and `/auth` routes. Preserve unrelated safe return parameters, capture a valid `lang` handoff in the locale cookie, and redirect to the sanitised URL. Keep the field list and path detection in `src/supacharger/auth/sensitive-auth-query.ts`; forms must still use POST and authoritative server-side validation because query sanitisation is defence in depth, not a submission boundary.

Keep the shared option shape, supported modes, managed route and form implementation, semantic presentation interface, and required English keys portable across consumers without prescribing a developer-owned application's selected passwordless mode, confirmation setting, sidecar contents, CSS values, root-layout composition, or formatting style.

Route configuration is `PATH_AUTH_GUARD` (the former `PATH_AUTH_GARD` spelling is not supported). Use `src/supacharger/auth/route-policy.ts` for exact paths, `:param` segments, and trailing `:param*` wildcards. Paths declared in `UNAUTHED_USER.ALLOWED` are public marketing or authentication surfaces. Protected API paths return JSON `401` responses; page paths may redirect with a safe relative `next` destination. The bare root destination `/` is implicit and must not be appended as `?next=%2F`; root destinations with a query string or fragment remain explicit. Product-specific public routes remain developer configuration or adapters outside the session adapter.

Keep the complete Next.js `/_next/` framework namespace outside Proxy matching so development assets and HMR never enter authentication routing. Keep crawler and application metadata outside it as well: `/robots.txt`, `/sitemap.xml`, platform association documents under `/.well-known/`, and `.webmanifest` files must return their direct responses without session refresh, localisation, authentication, onboarding, rewrite, or redirect handling. Permit only the narrow `127.0.0.1` hostname through `allowedDevOrigins` when loopback-origin development requests need to reach a server started on `localhost`.

## Configured authentication journey

The public user-facing routes `/account/login`, `/account/create`, `/account/login-magic`, and `/account/reset-password` live under `src/app/(supacharger)/(unauthenticated)/` and are exact managed Core. `/auth/callback`, `/auth/confirm`, and `/auth/error` are managed protocol/error routes. `/account/reset-password/new` shares the unauthenticated presentation shell but requires the authenticated recovery session established by the callback; it is not a public entry point. Do not add duplicate public paths under another route group because Next.js cannot resolve two pages to the same URL. The route shell and forms expose stable `sc-auth-*` hooks, import `AuthSidecar` and `AuthMobileBrand` from the developer-owned adapter, and receive presentation from `src/styles/supacharger-auth.css`. The CLI installs the adapter and stylesheet only when absent and preserves them on later updates.

`AUTHENTICATION` is the canonical feature policy. `EMAIL_PASSWORD.SIGN_IN` and `SIGN_UP` gate password operations. `PASSWORDLESS_EMAIL.SIGN_IN` and `SIGN_UP` independently select one exclusive mode: `disabled`, `otp`, or `link`; they never request both credentials in one passwordless email. A sign-in request always sets `shouldCreateUser: false`, while a configured passwordless signup may create the user. `PASSWORDLESS_EMAIL.OTP_LENGTH` is an integer from 6 through 10 and controls every rendered OTP field. `SIGN_UP_EMAIL_VERIFICATION` remains a separate password-signup policy and accepts `disabled`, `otp`, `link`, or `otp-and-link`. The managed TOTP factor journey is always exposed; `MFA_TOTP.REQUIRED_FOR_SIGN_IN` alone controls AAL2 enforcement for enrolled accounts. UI and server actions must enforce this value.

`NEXT_PUBLIC_SITE_URL` is the single runtime source for the canonical application origin. Read it through `getSiteUrl()` and construct paths with `getURL(path)`; never add a localhost or production fallback in application code. Missing configuration must fail clearly. Supabase's hosted URL allow-list remains separately configured, while a local `config.toml` may reference the same environment variable.

Successful OAuth PKCE callbacks must redirect through `USER_REDIRECTS.AUTHED_USER.LOGIN_REDIRECT_DESTINATION`, not directly to the Site URL. Passwordless email uses the separate token-hash `/auth/confirm` flow. `AUTHED_USER.HOME_PATH` remains the general authenticated home and may differ from the post-login destination when `/` is a public marketing page. Append the protected one-time login notice through `getAuthLoginRedirect()` so `AuthLoginNotice` shows the localised `AuthTerms.loginSuccess` toast and removes the query parameter. Billing access is an independent product policy: `BILLING_ACCESS.REQUIRED` may divert a callback before the normal login destination, while applications that do not force subscription access must leave it disabled.

Treat `USER_REDIRECTS.UNAUTHED_USER.LOGOUT_REDIRECT_DESTINATON` as a safe application-relative path. `POST /account/logout` clears the request-scoped SSR session and returns `{ success: true, redirectTo }`; the managed button navigates to that relative path and must not use `response.url`. `GET /account/logout` supports developer-owned direct-navigation controls and responds with `303` plus a relative `Location` header, which the browser resolves against the incoming request origin. Do not construct logout navigation from `NEXT_PUBLIC_SITE_URL`: a stale host, scheme, or port must not turn a successful cookie clear into a client-visible failure.

The shared clean-room journey uses SnapScreen as its approved visual and interaction basis. Preserve the strong heading treatment, progressive provider-to-email transition, dark auth surfaces, branded primary actions, and matching password-reset presentation across Core, SnapScreen, and Wakekeeper. Keep auth buttons and input fields at the shared 56 px height with 20 px by 12 px internal padding. Anchor the password-requirements checklist absolutely below the relative password-strength wrapper; it must float above following content without changing form height or covering its own password input. Keep signed-in password and confirmation fields in separate rows at every viewport width. OTP entry renders exactly `PASSWORDLESS_EMAIL.OTP_LENGTH` fields and uses the same length for Zod validation, messaging, and verification. Preserve distinct sign-in wording and `VerificationPurpose`: passwordless codes verify with `type: 'email'`, while password-signup confirmation codes verify with `type: 'signup'`. Preserve a safe relative `next` destination through route switches, sends, resends, and successful verification; reject absolute and protocol-relative destinations. Keep password, link, and OTP pending indicators action-specific. Client-facing Auth Server Actions return only selected plain success data or a safe `{ code, status }` error. Keep branding, copy overrides, product fields, and post-authentication actions in developer-owned adapters. Extend shared states within this presentation; do not replace it with a generic form or add application edits inside CLI-managed form files. Specdrive retains its authorised presentation by implementing the same adapter and semantic CSS seams; its former user-facing `/auth/*` pages redirect for one documented release and retain only an allowlisted safe `next` value.

Password signup must use the protected Server Action so the authoritative Zod parse, enabled-method policy, and safe error projection run on the server before `auth.signUp()`. Retain the submitted email and change local presentation state only after the action succeeds. Continue to use `startTransition` for imported Auth Server Actions initiated by login, signup, magic-link, and OTP controls.

Password changes post to the protected `/api/account/update-password` Route Handler. It strictly parses the current/new password payload with Zod, verifies the current Auth user, reauthenticates through `signInWithPassword`, applies the configured strength policy, then calls `updateUser`. Do not add a password-comparison RPC or database password oracle.

Password recovery uses Supabase SSR PKCE. `resetPasswordForEmail()` sends users to `/auth/callback?flow=recovery`; the Route Handler exchanges the one-use code exactly once, verifies that the JWT `amr` contains `method: 'recovery'`, and only then redirects to `/account/reset-password/new`. The protected `/api/account/recover-password` boundary repeats the recovery-AMR check, strictly parses both password fields with Zod, applies the same configured password-strength policy used by signup, and calls `updateUser`. Never exchange the recovery code in a Client Component, skip exchange because an unrelated session exists, or allow an ordinary signed-in/OAuth session to submit the recovery endpoint.

Use `src/components/ui/loading-spinner.tsx` as the canonical indeterminate loader. It renders the developer-owned `src/assets/svgr/ui/inline-loader.svg` through SVGR, so replace that single asset to change inline loading globally; callers must not import the SVG directly or add a second animation. Give standalone loaders a localised `label`, while decorative button loaders remain hidden from assistive technology. OTP verification cross-fades this loader into a green circle with a white Lucide tick before redirecting.

`AUTH_PROVDERS_ENABLED` is a complete boolean map for the canonical social OAuth provider union: `apple`, `azure`, `bitbucket`, `discord`, `facebook`, `figma`, `github`, `gitlab`, `google`, `kakao`, `keycloak`, `linkedin_oidc`, `notion`, `twitch`, `x`, `twitter`, `slack_oidc`, `slack`, `spotify`, `workos`, and `zoom`. Render only enabled providers and reject disabled values in the server action as well as hiding them in the UI. Prefer `linkedin_oidc`, `slack_oidc`, and `x` for new integrations; the unqualified Slack and Twitter keys exist for legacy Supabase providers. Provider artwork is managed under `src/supacharger/assets/svgr/auth-providers/`. Email, Phone, SAML, and Web3 artwork may be present there but does not make those method-specific flows ordinary OAuth providers.

Passwordless email uses Supabase's hosted **Magic Link or OTP** template, and its contents must match the selected exclusive mode. OTP mode contains `{{ .Token }}` and no login link; link mode contains the token-hash link and no OTP. `signInWithOtp()` uses `shouldCreateUser: false` for sign-in and nominates the safe confirmation redirect. Entered passwordless codes call `verifyOtp({ email, token, type: 'email' })`. Password-signup verification is independent: `disabled` requires confirmations off, `otp` uses the configured-length token, `link` uses a token-hash link, and `otp-and-link` may include both alternatives in the **Confirm signup** template. Signup codes call `verifyOtp({ email, token, type: 'signup' })`; when both alternatives are sent, consuming either may invalidate the other. Keep `PASSWORDLESS_EMAIL.OTP_LENGTH`, local `[auth.email] otp_length`, and the hosted OTP-length setting equal. A copied local `config.toml` or template never configures the hosted project. `/auth/confirm` validates safe destinations and token hashes; `/auth/callback` exchanges PKCE codes for OAuth and password recovery, distinguishing recovery with the verified JWT authentication method. `EMAIL_RESEND_COOLDOWN_SECONDS` must not be shorter than the hosted Auth rate limit.

Mobile verification uses the developer-owned `MOBILE_DEEP_LINKING` identifiers and the protected generated association routes. OTP code entry does not require deep linking; magic-link, link-confirmation, and reset callbacks do. Preserve the PKCE verifier boundary by completing the callback in the same web view or native Supabase client that initiated it. Follow `docs/agents/mobile-auth-deep-linking.md` before changing the association documents, Proxy exclusions, callback bridge, or native setup guidance.

Proxy provides session refresh and optimistic page routing only. Route Handlers and Server Functions authenticate their own requests, domain services enforce application permissions, and RLS plus grants remain authoritative. Do not use `getSession().user`, `user_metadata`, Proxy redirects, or UI state as an authorisation decision.

## Canonical global role

`app.user_roles` is the private source for a user's global application role. `app.custom_access_token_hook(jsonb)` runs as `supabase_auth_admin` through the Auth Hook configuration and emits a top-level `user_role` claim. Only `supabase_auth_admin` may read the table through its narrow RLS policy or execute the hook; browser roles receive neither privilege.

Assign roles through reviewed migrations or a separately approved trusted administrative boundary. Never expose a self-assignment RPC. A role update does not change an already-issued JWT; require a session refresh and treat the database as authoritative when revocation must be immediate.

Core calls `app.custom_access_token_claims_extension(event jsonb, canonical_claims jsonb)` after producing the canonical role and active-organisation claims. The default extension returns an empty object. Applications may replace only this function through a new forward migration and return compact product-owned claims. The managed hook rejects Supabase-required, optional, global-role, and active-organisation claim names so product code cannot override the Core trust contract.

Keep the extension `security invoker`, grant execute only to `supabase_auth_admin`, and give that role only the table grants and RLS policy required by the product query. Use the developer-owned `supabase/templates/custom-access-token-claims-extension.sql` as a starting point. Never edit an applied migration, put personal data or unbounded collections into a JWT, or use `user_metadata` as an authorisation source.

## Resource-scoped roles and organisation context

Do not force organisation, team, project, or account membership into `app.user_roles`. The canonical optional foundation is `app.organisations`, `app.organisation_members`, invitations, access requests, and `app.user_session_contexts`. `ORGANISATIONS.ENABLED` controls exposure, not installation. Every organisation action calls the authenticated `api.organisations(input_payload)` dispatcher, which derives identity, verified email, and session state from the JWT; never accept client-supplied user/session identifiers or place an organisation handle in arbitrary Auth metadata. A compact active-context claim may help navigation, but it is derived from server-owned session context, refreshed after switching or other context-changing mutations, bounded in size, and checked against current membership at the data boundary.

The hook emits `active_organisation_id`, `active_organisation_handle`, `active_organisation_role`, and `organisation_context_version` only when a valid session context exists. Removing a member or changing a role invalidates stale contexts, and callers must refresh the session when the RPC returns `requiresSessionRefresh`. Product-specific organisation fields and presentation remain application-owned.

## CLI and deployment

Create role/hook changes with `supabase migration new`, verify a clean local reset and database lint, regenerate local types, and keep `[auth.hook.custom_access_token]` pointed at `pg-functions://postgres/app/custom_access_token_hook`. `config.toml` changes only the local stack.

For every hosted environment, complete and verify this separate release operation:

1. Confirm the canonical migration is present in the hosted migration ledger.
2. Use an organisation or project Owner or Administrator account; Developer and Read-Only roles cannot update Auth configuration and may receive `403` from the dashboard or Management API.
3. Open **Authentication → Hooks**, choose **Custom Access Token**, select the **Postgres Function** or **SQL** type, and select exactly `app.custom_access_token_hook`.
4. Enable and save the setting. Do not create a duplicate function or select a similarly named function in another schema.
5. Obtain a newly issued token by signing in again or refreshing the session, then verify with `supabase.auth.getClaims()` that `claims.user_role` exists.

Treat a successful password login without `user_role` as a failed hosted-hook verification. If the database ledger and local configuration are current, inspect the hosted selection and account permissions rather than adding compatibility code or changing the application to trust user-editable metadata.

The Supacharger CLI must preserve developer configuration, distribute the config contract and migrations, preview linked migration changes, and never silently mutate a hosted database. Keep migration and dashboard steps in release/upgrade guidance.

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


## Project request guard

`src/supacharger.adapters/request-guard.ts` is a developer-owned, default-no-op adapter. Export `resolveProjectRequest` using `ProjectRequestGuard` from `src/supacharger/request-guard-contract.ts`. Return a NextResponse to stop rendering, or null to continue. It runs after session verification and authentication redirects, and receives the same verified request client; do not construct another Auth client or verify the session again. Use narrowly matched, bounded availability checks where a real status code must be decided before streamed rendering. Authorisation remains in route handlers and database policies. Thrown errors return a blank, private 503 response; do not convert transport failures to missing resources. All replacement responses preserve the latest session cookies and auth cache headers. Default consumers make no additional database calls.

The CLI installs this starter only when missing and preserves custom adapters on upgrades. Canonical Proxy, session adapter and contract must be synchronised together. No configuration property or database migration is added. The session adapter exposes its existing client plus getResponse() solely to retain current cookie state across the guard.

## Signup terms notice

Set `AUTHENTICATION.SIGN_UP_TERMS_URL` in developer-owned `src/supacharger.config.ts` to an absolute HTTP(S) URL. The default `null` hides the notice; invalid, relative and credential-bearing URLs are not rendered. The link opens a new tab with `noopener noreferrer`.

The shared login/signup form displays the notice beneath signup actions and on the provider chooser, where a social action can create an account even from sign-in. Wording follows the configured password, passwordless and social signup methods. `AuthJourney.signUpTerms`, `signUpTermsSocial`, `signUpTermsSocialOnly`, `signUpTermsPasswordless` and `signUpTermsPasswordlessSocial` are complete rich-text messages; preserve the `<terms>...</terms>` link tag when translating. English values are supplied; secondary catalogues remain pending translation.

This is a displayed notice, not a required checkbox or stored consent record. `ACCOUNT_REQUIRED_TERMS_AGREEMENT_PATH` remains separate. CLI upgrades add the missing setting as `null` and preserve an existing URL. Existing consumers receive the same property without changing their authentication methods. Configure the application's real terms URL before expecting a visible notice.
