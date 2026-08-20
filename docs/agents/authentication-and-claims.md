# Authentication, Proxy, roles, and custom claims

## Proxy contract

`src/proxy.ts` and `src/lib/supabase/middleware.ts` are shared core behaviour distributed by the CLI. Create one request-scoped Supabase server client and perform exactly one identity check. `SC_CONFIG.AUTH_SESSION.VERIFICATION_MODE` selects `getClaims()` (canonical default) or the explicit strict `getUser()` mode. Exclude `is_anonymous` identities unless `ALLOW_ANONYMOUS_USERS` is true. Keep product queries out of the session adapter.

Whenever `@supabase/ssr` changes auth cookies, preserve the mutated request cookies, response cookies, and its `Cache-Control`, `Expires`, and `Pragma` headers on every continuation, redirect, rewrite, and error response. Use `src/supacharger/auth/proxy-response.ts` and its `copySupabaseResponseState`; do not create a replacement response that drops this state.

Route configuration is `PATH_AUTH_GUARD` (the former `PATH_AUTH_GARD` spelling is not supported). Use `src/supacharger/auth/route-policy.ts` for exact paths, `:param` segments, and trailing `:param*` wildcards. Protected API paths return JSON `401` responses; page paths may redirect. Product-specific public routes and onboarding checks remain application extensions outside the session adapter.

## Configured authentication journey

`AUTHENTICATION` is the canonical feature policy. `EMAIL_PASSWORD.SIGN_IN` and `SIGN_UP` gate password operations; `MAGIC_LINK.ENABLED` and `ALLOW_SIGN_UP` gate passwordless email and `shouldCreateUser`; `SIGN_UP_EMAIL_VERIFICATION` is `disabled`, `link`, or `otp`; and `MFA_TOTP.ENABLED` advertises whether the application supplies a second-factor journey. UI and server actions must both enforce these values.

The shared clean-room journey uses SnapScreen as its approved visual and interaction basis. Preserve the strong heading treatment, progressive provider-to-email transition, dark auth surfaces, branded primary actions, and matching password-reset presentation across Core, SnapScreen, and Wakekeeper. It also provides correct email/current-password/new-password/one-time-code autocomplete purposes, six-digit sign-up OTP verification, resend cooldown, and a magic-link check-email state. Keep branding, copy overrides, product fields, and post-authentication actions in developer-owned adapters. Extend shared states within this presentation; do not replace it with a generic form or add application edits inside CLI-managed form files. Specdrive retains its separate Untitled UI presentation.

The selected email-verification value must match Supabase Auth: `disabled` requires email confirmations off; `otp` requires confirmations on and a six-digit token template; `link` requires confirmations on and a confirmation-link template. `EMAIL_RESEND_COOLDOWN_SECONDS` must not be shorter than the hosted Auth rate limit. A copied local `config.toml` or template does not configure the hosted project.

Mobile verification uses the developer-owned `MOBILE_DEEP_LINKING` identifiers and the protected generated association routes. OTP code entry does not require deep linking; magic-link, link-confirmation, and reset callbacks do. Preserve the PKCE verifier boundary by completing the callback in the same web view or native Supabase client that initiated it. Follow `docs/agents/mobile-auth-deep-linking.md` before changing the association documents, Proxy exclusions, callback bridge, or native setup guidance.

Proxy provides session refresh and optimistic page routing only. Route Handlers and Server Functions authenticate their own requests, domain services enforce application permissions, and RLS plus grants remain authoritative. Do not use `getSession().user`, `user_metadata`, Proxy redirects, or UI state as an authorisation decision.

## Canonical global role

`app.user_roles` is the private source for a user's global application role. `app.custom_access_token_hook(jsonb)` runs as `supabase_auth_admin` through the Auth Hook configuration and emits a top-level `user_role` claim. Only `supabase_auth_admin` may read the table through its narrow RLS policy or execute the hook; browser roles receive neither privilege.

Assign roles through reviewed migrations or a separately approved trusted administrative boundary. Never expose a self-assignment RPC. A role update does not change an already-issued JWT; require a session refresh and treat the database as authoritative when revocation must be immediate.

## Resource-scoped roles and organisation context

Do not force organisation, team, project, or account membership into `app.user_roles`. The canonical dormant foundation is `app.organisations`, `app.organisation_members`, and `app.user_session_contexts`. `ORGANISATIONS.ENABLED` controls exposure, not installation. Organisation creation or selection uses the service-only `api_edge` adapters after authentication; never place an organisation handle in arbitrary Auth metadata. A compact active-context claim may help navigation, but it is derived from server-owned session context, refreshed after switching, bounded in size, and checked against membership at the data boundary.

The hook emits `active_organisation_id`, `active_organisation_handle`, `active_organisation_role`, and `organisation_context_version` only when a valid session context exists. Product-specific organisation fields and onboarding presentation remain application-owned.

## CLI and deployment

Create role/hook changes with `supabase migration new`, verify a clean local reset and database lint, regenerate local types, and keep `[auth.hook.custom_access_token]` pointed at `pg-functions://postgres/app/custom_access_token_hook`. A hosted project also requires the hook selection under Authentication → Hooks; `config.toml` alone changes only the local stack.

The Supacharger CLI must preserve developer configuration, distribute the config contract and migrations, preview linked migration changes, and never silently mutate a hosted database. Keep migration and dashboard steps in release/upgrade guidance.
