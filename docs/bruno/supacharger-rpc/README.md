# Supacharger RPC Bruno collection

This collection documents and exercises the canonical client-callable RPCs in Supacharger's `api` schema. Set `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, and a signed-in user's `SUPABASE_ACCESS_TOKEN` in a local Bruno environment before running authenticated requests.

The collection is exact CLI-managed Core documentation. Managed consumers receive a byte-identical copy. Do not add Specdrive, SnapScreen, Wakekeeper, or other consumer-specific RPCs here. Promote a reusable database contract into Supacharger before documenting it in this collection. Server-only `api_edge` functions are excluded because they require privileged credentials and mutate internal Stripe projections; their contracts remain documented in migrations and server code without placing secret-key workflows in the client RPC collection.

## Refresh contention and outage containment

Session renewal follows [Supabase’s Next.js SSR guide](https://supabase.com/docs/guides/auth/server-side/creating-a-client?framework=nextjs). Each request creates its own server client; React cache only shares it within a render request. Proxy calls `getClaims()` immediately after creating its client. The SDK refreshes expired sessions, and `setAll` passes updated cookies to both the incoming request and outgoing response, including Supabase’s cache-prevention headers. Redirects and project guards preserve that response state.

Supabase owns token storage, rotation, refresh retries and session clearing. Core does not intercept the token endpoint, retain token responses in a process-wide cache, impose custom refresh admission limits or decode session cookies itself. `isLoggedIn()` uses the SDK’s verified `getClaims()` result. Keep browser, server and Proxy clients on the same supported `tokens-only` encoding; never trust `getSession().user` for authorisation.

If the SDK returns a retryable transport error, HTTP 429 or HTTP 5xx during Proxy verification, the application returns a private, no-store HTTP 503 with `Retry-After: 30`. Browser requests receive the standalone connection page; API requests and Server Actions receive `auth_temporarily_unavailable`. This presentation does not change the SDK’s retry or cookie behaviour. There is no automatic page reload. Permanent invalid-session errors follow normal authentication routing. Direct Supabase endpoints retain their own status codes and hosted rate limits.

## Password recovery email contract

Follow [Supabase’s password recovery guide](https://supabase.com/docs/guides/auth/passwords?flow=pkce). `sendPasswordReset` validates the email on the server and calls `resetPasswordForEmail(email, { redirectTo })` with the validated request-origin confirmation URL. The hosted recovery template contains:

```html
<a href="{{ .RedirectTo }}?token_hash={{ .TokenHash }}&amp;type=recovery">Reset password</a>
```

Set Supabase’s Site URL to the application’s canonical HTTPS origin. `/auth/confirm` validates the token/type, calls `verifyOtp` with `type=recovery` and redirects to `/account/reset-password/new`. The password-write endpoint independently validates the payload and verifies the current user with `getUser` before `updateUser`. Supabase enforces its password-update policy. Token-hash verification issues an `otp` AMR; Core does not require a custom recovery AMR or add a separate recovery credential. Recovery ignores arbitrary `next` destinations. Invalid, expired or consumed recovery tokens redirect to `/auth/error?flow=recovery`, even if the browser already has another session. Tokens and raw Auth errors are excluded from redirects.

OAuth still uses the PKCE `/auth/callback`. Existing recovery PKCE links remain accepted there during deployment, but new recovery templates use token hashes and do not require the initiating browser’s verifier. Deploy Core and consumers, then install their hosted templates. The hosted allow-list must accept each request-origin confirmation destination. `NEXT_PUBLIC_SITE_URL` remains the canonical URL for metadata and background links.

## Canonical URL and request domains

`NEXT_PUBLIC_SITE_URL` remains the required canonical origin for metadata, sitemap and links generated without a request. `getSiteUrl()` and `getURL()` are for those canonical links. They do not select the domain for authentication or Stripe returns.

Server Actions use `getRequestOrigin()` / `getRequestURL()`; Route Handlers use `getAppRequestOrigin(request)` and `appURL(path, origin)`. These validate the incoming origin and build only safe application-relative paths. OAuth, signup/resend, passwordless links, recovery, email changes, Stripe Checkout/Portal and session-transfer journeys retain the initiating domain. Internal navigation should use relative paths.

The canonical origin is allowed automatically. Exact `VERCEL_URL` and `VERCEL_PROJECT_PRODUCTION_URL` deployment origins are also allowed when present. For additional custom domains, set server-only `APP_ALLOWED_ORIGINS` to a comma-separated list of complete origins, for example `https://alias.example.com,https://other.example.com`. Omit it for a single canonical domain. No wildcard hosts are accepted. Request Origin and Host/forwarded-host must agree; unknown origins are rejected, never silently redirected to the canonical domain. A reverse proxy must preserve the public request URL and supply consistent host/protocol headers.

Register the same supported domains and actual redirect destinations in Supabase Auth's redirect allow-list. Recovery sends `redirectTo=<origin>/auth/confirm`; signup and email changes also supply a complete `/auth/confirm?next=...` URL. Recovery templates append `?token_hash=...&type=recovery` to the query-free `RedirectTo`. Signup and email-change templates append `&token_hash=...&type=...` to their query-bearing `RedirectTo`. Never append another route. Query-bearing redirect destinations must match the hosted allow-list; do not register token-bearing links. Keep Supabase Site URL as the default for dashboard/admin/background operations without an explicit destination. Invitations issued without an application request keep that default.

Deploy application changes before installing the new hosted recovery template. Local templates do not update hosted Auth. Cookies remain domain-scoped: preserving a domain does not create cross-domain SSO. Native associations must also be configured on each supported native-link host. No database migration is needed for request-domain routing.

## Social profile initialisation

The OAuth callback calls `initialise_social_profile_by_current_user` before onboarding and uses `complete_social_avatar_by_current_user` after private image processing. Both are one-time mutations, not read requests. See their embedded documentation for preservation, failure and ownership rules. Existing profile reads and avatar-edit requests retain their signatures.

Username-enabled applications then call `initialise_account_username_by_current_user` to persist an email-derived, collision-safe default. Email sign-ins and direct setup use the same allocation. See the request for removal preservation and configuration behaviour.
