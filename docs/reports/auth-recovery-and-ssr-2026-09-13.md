# Supabase SSR and recovery repair — 13 September 2026

## Approved scope and source

The owner approved Core updates across Wakekeeper, SnapScreen and Specdrive, removal of the legacy Brevo signup addition, correction of Auth templates and restoration of Supabase-standard renewal. Sources reviewed:

- https://supabase.com/docs/guides/auth/server-side/creating-a-client?framework=nextjs
- https://github.com/supabase/supabase/blob/master/examples/auth/nextjs/lib/supabase/proxy.ts
- https://supabase.com/docs/guides/auth/passwords?flow=pkce
- https://supabase.com/docs/guides/auth/auth-email-templates
- Installed @supabase/ssr 0.12.4 and @supabase/supabase-js 2.112.3 source.

## Result

Password recovery now follows the documented SSR TokenHash/verifyOtp flow at `/auth/confirm`. The server validates inputs with Zod and requires verified recovery AMR before opening the new-password page; the write endpoint independently validates the password and recovery session. Invalid/reused/expired recovery tokens cannot reuse an unrelated signed-in session. The error page provides a reset-link action. The request calls `resetPasswordForEmail(email)`; Supabase Site URL determines the template origin. OAuth and existing recovery PKCE callbacks remain supported for deployment compatibility.

The custom refresh transport and manual cookie reader are removed. Supabase owns refresh retries, rotation and cookie clearing. Proxy invokes getClaims immediately after client creation and preserves rotated request cookies, response cookies and anti-cache headers. Existing anonymous-user and product route policies remain. The application only classifies the SDK’s final retryable error for its existing 503 presentation.

196 current managed files are SHA-256 identical across all three consumers, with no extra files under managed paths. Historical core locks are unchanged because this working tree has not been published. Specdrive keeps its product UI, organisation callback, account media and menu ordering through developer-owned adapters. Two independent, non-visual Specdrive fixes were promoted: skip organisation-media signing when disabled and only redirect recognised missing/forbidden organisation errors. Other service failures propagate. Legacy Brevo registry/checkbox files are removed from SnapScreen and Specdrive.

Specdrive receives the missing canonical session-transfer configuration contract, routes, English messages and database types. Its feature remains disabled. The canonical migration is installed through new forward migration `20260913180000_align_core_auth_session_transfers.sql` and an explicit migration alias; no installed migrations were rewritten. It was applied only to local `supabase_db_specdrive`. RLS is enabled, anon/authenticated execute grants are absent, service-role execution is present, and the ledger entry is verified. Hosted Specdrive migration remains pending.

## Templates and documentation

All applications have a local recovery template and config stanza. Wakekeeper’s branded repository fixes recovery, signup, invitation and email-change links; its passwordless template is OTP-only to match the application. English source values are present; secondary additions are empty untranslated placeholders. Docusaurus setup, email examples, authentication and mobile guidance reflect the new flow. The shared Bruno README and Wakekeeper’s separate Auth requests document SDK renewal and recovery. Specdrive OpenAPI and README document the changed browser contracts and disabled session-transfer capability; direct public RPC bodies are unchanged.

## Verification

- Ten Core regression tests pass: fresh-browser recovery, missing/invalid/reused/expired token behaviour, recovery claims, safe signup redirects, unsupported OTP types and request/response cookie propagation.
- TypeScript passes in Core, Wakekeeper, SnapScreen and Specdrive.
- Focused ESLint passes with existing signup-form React Hook Form/compiler warnings.
- Specdrive English catalogue validator passes; new recovery and email source values manually verified in all catalogues.
- Docusaurus production documentation build passes with existing blog/description warnings.
- HTML Auth links parsed after substituting example variables: all resolve to one `/auth/confirm` path with the intended token/type; the OTP-only template has no login link.
- No consumer tests were added. No application production build or real password reset was performed.

## Production blockers

No hosted settings, templates, application deployments or production data were changed. The available Supabase MCP still resolves to Wakekeeper and has no Auth configuration/template mutation tool. The inspected Core authorisation page reported the current account was not a member of its organisation. Vercel MCP confirms production projects but exposes no environment-variable editor.

Wakekeeper’s logs show reset requests specifying the Core demo callback and email links returning to `http://members.wakekeeper.app/`. Set both its Supabase Site URL and production NEXT_PUBLIC_SITE_URL to `https://members.wakekeeper.app`; inspect and preserve valid callback allow-list entries. A reviewed Management API patch is prepared at `wakekeeper-spacharger-app/reports/auth-recovery-2026-09-13/hosted-auth.patch.json`.

Core’s recovery error proves a bad PKCE verifier, not a missing route. Preserve the current hosted template presentation and replace its recovery link with `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&amp;type=recovery&amp;next=/account/reset-password/new`. Its hosted Site URL and Vercel NEXT_PUBLIC_SITE_URL should be `https://demo.supacharger.dev`.

Publish/deploy repaired Core and consumers, install hosted templates, then verify newly issued production links. Do not reuse previously consumed links. No 100% production parity or end-to-end recovery success is claimed.

## Changed source files

Shared paths (Core first, then all three consumers):

- `src/lib/supabase/server.ts`
- `src/lib/supabase/supacharger/proxy.ts`
- `src/lib/supabase/supacharger/supabase-auth.ts`
- Removed `src/lib/supabase/supacharger/refresh-transport.ts` and `passive-session.ts`
- `src/app/(supacharger)/(unauthenticated)/auth/confirm/route.ts`
- `src/app/(supacharger)/(unauthenticated)/auth/error/page.tsx`
- `src/supacharger/account/account-summary.ts`
- `src/supacharger/organisations/organisation-service.ts`
- `supabase/config.toml`, `supabase/templates/recovery.html`, and `messages/*.json`
- `docs/agents/authentication-and-claims.md`, `docs/agents/mobile-auth-deep-linking.md`, and `docs/bruno/supacharger-rpc/README.md`

Additional Specdrive parity paths:

- `src/proxy.ts`
- `src/supacharger/account/settings/account-details-form.tsx`
- `src/supacharger/account/settings/account-settings-contract.ts`
- `src/supacharger/account/settings/account-settings-shell.tsx`
- `src/supacharger/supacharger-config-contract.ts`, `src/supacharger.config.ts`
- `src/supacharger/auth/session-transfer.js`
- `src/app/(supacharger)/(unauthenticated)/auth/session-transfer/route.ts`
- `src/app/(supacharger)/api/(supacharger)/auth/session-transfers/route.ts`
- `src/app/(supacharger)/api/(supacharger)/auth/session-transfers/redeem/route.ts`
- `src/supacharger.adapters/account/navigation.ts`, `profile-media.tsx` and `account-media-field.tsx` (the last moved out of managed account settings)
- `src/lib/supabase/types.ts`, `.supacharger/migration-aliases.json`, and `supabase/migrations/20260913180000_align_core_auth_session_transfers.sql`
- `README.md`, `docs/api/supabase-rpc.openapi.yaml`

SnapScreen and Specdrive also replace `src/supacharger/components/forms/create-account-form.tsx` with Core and remove the unused `src/supacharger/plugins/registry.ts` and `src/supacharger/plugins/scp_brevo/brevoNewsletterRegistrationCheckbox.tsx`.

Core regression coverage is in `test/auth-recovery.test.mjs`. Branded Wakekeeper edits are in the separate email repository's `supabase/{confirm-signup,reset-password,magic-link-or-otp,invite-user,change-email-address}.html` and `supabase/README.md`. Separate Wakekeeper Bruno edits are `Wakekeeper/collections/Supabase/auth_refresh_session.yml`, `auth_sign_up_email_password.yml`, and `Wakekeeper/docs/supabase-bruno-sync.md`.
