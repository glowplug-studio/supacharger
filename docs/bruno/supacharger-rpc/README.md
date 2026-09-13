# Supacharger RPC Bruno collection

This collection documents and exercises the canonical client-callable RPCs in Supacharger's `api` schema. Set `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, and a signed-in user's `SUPABASE_ACCESS_TOKEN` in a local Bruno environment before running authenticated requests.

The collection is exact CLI-managed Core documentation. Managed consumers receive a byte-identical copy. Do not add Specdrive, SnapScreen, Wakekeeper, or other consumer-specific RPCs here. Promote a reusable database contract into Supacharger before documenting it in this collection. Server-only `api_edge` functions are excluded because they require privileged credentials and mutate internal Stripe projections; their contracts remain documented in migrations and server code without placing secret-key workflows in the client RPC collection.

## Refresh contention and outage containment

Session renewal follows [Supabase’s Next.js SSR guide](https://supabase.com/docs/guides/auth/server-side/creating-a-client?framework=nextjs). Each request creates its own server client; React cache only shares it within a render request. Proxy calls `getClaims()` immediately after creating its client. The SDK refreshes expired sessions, and `setAll` passes updated cookies to both the incoming request and outgoing response, including Supabase’s cache-prevention headers. Redirects and project guards preserve that response state.

Supabase owns token storage, rotation, refresh retries and session clearing. Core does not intercept the token endpoint, retain token responses in a process-wide cache, impose custom refresh admission limits or decode session cookies itself. `isLoggedIn()` uses the SDK’s verified `getClaims()` result. Keep browser, server and Proxy clients on the same supported `tokens-only` encoding; never trust `getSession().user` for authorisation.

If the SDK returns a retryable transport error, HTTP 429 or HTTP 5xx during Proxy verification, the application returns a private, no-store HTTP 503 with `Retry-After: 30`. Browser requests receive the standalone connection page; API requests and Server Actions receive `auth_temporarily_unavailable`. This presentation does not change the SDK’s retry or cookie behaviour. There is no automatic page reload. Permanent invalid-session errors follow normal authentication routing. Direct Supabase endpoints retain their own status codes and hosted rate limits.

## Password recovery email contract

Follow [Supabase’s password recovery guide](https://supabase.com/docs/guides/auth/passwords?flow=pkce). `sendPasswordReset` validates the email on the server and calls `resetPasswordForEmail(email)`. The hosted and local recovery template contains:

```html
<a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&amp;type=recovery&amp;next=/account/reset-password/new">Reset password</a>
```

Set Supabase’s Site URL to the application’s canonical HTTPS origin. `/auth/confirm` validates the token/type, calls `verifyOtp`, verifies recovery AMR and redirects to `/account/reset-password/new`. The password-write endpoint independently validates the payload and recovery session before `updateUser`. Recovery ignores arbitrary `next` destinations. Invalid, expired or consumed recovery tokens redirect to `/auth/error?flow=recovery`, even if the browser already has another session. Tokens and raw Auth errors are excluded from redirects.

OAuth still uses the PKCE `/auth/callback`. Existing recovery PKCE links remain accepted there during deployment, but new recovery templates use token hashes and do not require the initiating browser’s verifier. Deploy Core and consumers, then install their hosted templates; local `config.toml` never updates hosted Auth. A correct template cannot repair an incorrect Supabase Site URL. Keep `NEXT_PUBLIC_SITE_URL` aligned for other application-generated links.
