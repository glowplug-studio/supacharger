# Email template resources

# Optional email resources

These Git-tracked Kuronet-styled examples are copied on initial installation. They are developer-owned, excluded from Supacharger CLI updates, Vercel uploads and Next.js deployment traces. Git pulls can still update committed files. They are not connected to local Supabase configuration and are never uploaded automatically.

`template.html` is generic Brevo HTML. `supabase/` contains the six Auth email categories, seven security notifications, and an optional signup OTP alternative. The nine Wakekeeper email categories are covered without copying Wakekeeper branding. Notification enablement is separate.

The standard bodies use Supabase content and tokens. The existing reset example deliberately retains the approved Kuronet wording, plain-text URL and Core SSR `RedirectTo`/`TokenHash` recovery contract. `confirm-signup-otp.html` is an optional alternative, not an additional hosted email setting.

## Agent application workflow

When asked to style or upload Supabase emails, read these files and use the connected Supabase MCP to inspect the intended project's Auth template settings. Resolve the target from the user's request; do not assume a consumer means the Core hosted project. Adapt the logo, brand and links while preserving the project's signup, passwordless and recovery token/redirect contracts. The default link examples use `ConfirmationURL`; Core SSR flows may require `RedirectTo` and `TokenHash`. Select link or OTP content to match the application. Apply only the requested template bodies through the Supabase MCP and read them back to verify. Preserve unrelated Auth settings, subjects and notification enablement unless requested. Do not add local template overrides. If the connected tools cannot update Auth templates, report the limitation instead of claiming an upload.

Keep `{{ .SiteURL }}`, `{{ .Email }}` and other Supabase variables intact. Replace the demo logo at its hosted image URL as needed. Removing the Supacharger attribution requires an attribution licence.

Reference: https://supabase.com/docs/guides/auth/auth-email-templates

The repository MCP exposes `supacharger_get_email_template` and `supacharger://email-templates/{template}` resources. `brevo` returns the generic HTML; `supabase_` names identify the Auth files with hyphens replaced by underscores. The optional signup OTP alternative is deliberately excluded from the MCP catalogue.
