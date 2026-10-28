# HTML email template resources

## Optional email resources

These Git-tracked Kuronet-styled examples are copied on initial installation. They are developer-owned, excluded from Supacharger CLI updates, Vercel uploads and Next.js deployment traces. Git pulls can still update committed files. They are not connected to local Supabase configuration and are never uploaded automatically.

`template.html` is generic Brevo HTML. `supabase/` contains the six Auth email categories, seven security notifications, and an optional signup OTP alternative. The nine Wakekeeper email categories are covered without copying Wakekeeper branding. Notification enablement is separate.

The standard bodies use Supabase content and tokens. The existing reset example deliberately retains the approved Kuronet wording, plain-text URL and Core SSR `RedirectTo`/`TokenHash` recovery contract. `confirm-signup-otp.html` is an optional alternative, not an additional hosted email setting.

## Agent application workflow

When asked to style or upload Supabase emails, first verify the connected Supabase MCP's target and available tools. Resolve the target from the user's request; do not assume a consumer means the Core hosted project. If MCP cannot inspect or edit Auth settings, use the Supabase Management API with an existing authorised credential, or the dashboard. Never expose credentials, store them in the repository, or describe a Management API update as an MCP upload. Read back the hosted settings after applying the requested changes and preserve unrelated Auth settings, subjects and notification enablement.

Before choosing template tokens, inspect both the live project's Auth configuration and the application's implementation. Read hosted email confirmation settings, OTP length, Site URL, redirect allow-list and existing template bodies. Compare them with `src/supacharger.config.ts`, the signup/passwordless/recovery callers and the confirmation handler: check which modes are enabled, the exact `redirectTo` or `emailRedirectTo` shape, and the verification types the handler accepts. Hosted settings alone do not establish whether the application expects an OTP, a Supabase verification link or an application-handled token hash.

Treat `src/supacharger.config.ts` as the application's declared intent and corroborate it against the implemented flows and hosted Supabase settings. Inspect `AUTH_PROVDERS_ENABLED` (the canonical spelling), `AUTHENTICATION.EMAIL_PASSWORD`, `AUTHENTICATION.PASSWORDLESS_EMAIL` and `AUTHENTICATION.SIGN_UP_EMAIL_VERIFICATION`. Compare enabled social providers with hosted provider enablement and required callback configuration; compare email signup/sign-in availability, confirmation requirements and OTP length with the corresponding hosted settings and template content. Local `supabase/config.toml` describes the local stack and is not evidence of hosted configuration.

Raise contradictions explicitly before changing Auth behaviour. For each finding, state the application setting, the observed hosted or template value, the affected flow and the proposed correction. Distinguish a broken flow from an intentional difference, such as a hosted provider enabled but hidden by the application; mark inaccessible settings as unverified rather than assuming they match. Do not reveal provider secrets. Do not silently enable providers, change application policy or alter notification switches to reconcile differences. Resolve only changes already authorised by the user; request a decision when the intended behaviour is ambiguous.

Use that comparison to adapt the requested hosted bodies: `{{ .Token }}` for code entry, `{{ .ConfirmationURL }}` where the application supports Supabase's verification-link flow, or `{{ .RedirectTo }}` with `{{ .TokenHash }}` and the handler's accepted `type` for application-handled links. Preserve required query parameters and apply the same destination to HTML buttons, Outlook buttons and visible fallback URLs. Keep template styling intact. Validate rendered links with representative values, read back uploaded bodies and test the intended flow. Report configuration mismatches; only change hosted settings when authorised, rather than changing the application's Auth mode to fit an example template.

Adapt the logo, brand and links while preserving the application's actual signup, passwordless and recovery flows. Check that the hosted Email OTP length matches the application's `PASSWORDLESS_EMAIL.OTP_LENGTH`. OTP modes need `{{ .Token }}`; use `confirm-signup-otp.html` for signup OTP and adapt the passwordless body to the configured mode. Do not replace a working hosted OTP body with a generic link example. Core recovery passes a query-free confirmation destination, so the HTML button, Outlook button and visible fallback URL must all use `{{ .RedirectTo }}?token_hash={{ .TokenHash }}&amp;type=recovery`. Use `&amp;token_hash` only when the supplied redirect already contains a query. Inspect each flow's caller before adapting link templates.

Verify required confirmation destinations against the application's allowed origins and add them only to the intended hosted project's redirect allow-list, preserving existing entries. Keep project-specific hosted addresses out of these reusable resources. Do not add local Supabase template files or configuration overrides.

Keep `{{ .SiteURL }}`, `{{ .Email }}` and other Supabase variables intact. Replace the demo logo at its hosted image URL as needed. Removing the Supacharger attribution requires an attribution licence.

Reference: https://supabase.com/docs/guides/auth/auth-email-templates

The repository MCP exposes `supacharger_get_email_template` and `supacharger://email-templates/{template}` resources. `brevo` returns the generic HTML; `supabase_` names identify the Auth files with hyphens replaced by underscores. The optional signup OTP alternative is deliberately excluded from the MCP catalogue.

For email changes, the supplied `change-email-address.html` uses `{{ .ConfirmationURL }}`. Core supports its pending dual-confirmation message and subsequent PKCE return to `/auth/confirm?next=/account/security`. A custom token-hash alternative uses `{{ .RedirectTo }}&amp;token_hash={{ .TokenHash }}&amp;type=email_change`; keep the existing `next` query. Do not change secure email-change policy to hide the intermediate state.
