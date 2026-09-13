# Mobile authentication deep linking

## Ownership and configuration

`MOBILE_DEEP_LINKING` is the canonical developer-owned configuration contract. Never hard-code an application's Apple App ID, bundle identifier, Android package, or signing fingerprint inside a CLI-managed association route. Never copy identifiers between consumers.

The protected core generates `/.well-known/apple-app-site-association` from `IOS.APP_IDS` and `ASSOCIATED_PATHS`, and `/.well-known/assetlinks.json` from `ANDROID.APPS`. A platform endpoint returns `404` while disabled or unconfigured. Configured responses must be direct HTTPS `200` JSON responses with no authentication, localisation, onboarding, rewrite, or redirect. Keep `.well-known` outside Proxy matching.

Use Apple's current `appIDs` plus `components` AASA format without mixing it with the legacy `appID` plus `paths` format. Android statements use `delegate_permission/common.handle_all_urls`; native intent filters remain responsible for path restrictions on Android versions that do not support dynamic server rules. Validate identifiers and uppercase colon-separated SHA-256 certificate fingerprints before publishing.

## Authentication flow

Six-digit email OTP verification remains an in-app code-entry flow. Magic links, link confirmation, and password reset use verified HTTPS callbacks. Recovery verifies `TokenHash` with `type=recovery` through `/auth/confirm`; associate that path alongside the OAuth `/auth/callback`, not the internal recovery-session-only `/account/reset-password/new` page. Keep the hosted Supabase Site URL and exact redirect allow-list aligned with the deployed host and the paths in `ASSOCIATED_PATHS`. Local `supabase/config.toml` does not change hosted Auth settings.

When cross-device session transfer is enabled, add `/auth/session-transfer` to `ASSOCIATED_PATHS`. Native code must open the exact Universal Link, including its fragment, in a shared persistent browser session such as the application's established `ASWebAuthenticationSession` or `SFSafariViewController` flow. A private or isolated web view will not establish the intended reusable browser session. Do not read, log or send the fragment to native analytics. The web bootstrap owns token removal and redemption.

Supacharger uses PKCE for SSR callbacks. The client that starts the flow owns the verifier and must complete the exchange:

- a native wrapper loads the verified callback in the same persistent web view and cookie store;
- a fully native app initiates and exchanges through the same native Supabase client and secure storage adapter; and
- no implementation logs or forwards an auth code, token hash, access token, refresh token, or verifier.

Validate the incoming scheme, host, and path in native code. Preserve the query string for the callback, reject arbitrary `next` destinations, and test cold start, warm start, expired/consumed links, web fallback, and every production signing variant.

## Verification

Verify both well-known URLs with `curl` before testing a signed app. Use Apple's `swcutil`/device diagnostics and Android's `pm set-app-links`, `pm verify-app-links --re-verify`, and `pm get-app-links`. Android fingerprints must normally come from Play App Signing rather than a local upload key.

The human guide is `supacharger-docs/docs/Application Development/mobile-auth-deep-linking.md`.
