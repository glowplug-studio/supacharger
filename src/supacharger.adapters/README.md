# Supacharger application adapters

This directory is developer-owned and preserved by `supacharger coreupdate`.

Use it for application-specific authentication context and post-sign-in onboarding adapters. The authentication adapter collects extra context and selects it only after sign-in. The onboarding adapter declares product fields and completes authenticated work such as organisation creation before returning an optional destination. The core owns the journey and adapter interfaces; the application owns product fields, organisation-specific decisions, destinations, and presentation.

Do not place credentials here or rely on client-side adapter checks for authorisation.

`auth/auth-sidecar.tsx` owns the product side of the managed split authentication shell. Export `AuthSidecar` for the desktop sidecar and `AuthMobileBrand` for the compact brand shown above forms on smaller screens. The CLI preserves both exports during updates.

`billing/acquisition.tsx` supplies the product catalogue shown by the managed personal acquisition route. `billing/database.ts` adapts the application's installed forward-only billing RPC signatures. `billing/organisation.ts` resolves an organisation billing account only after product membership authorisation. The managed service still performs its own billing-manager check. The CLI installs these files only when missing and preserves application implementations thereafter.

`organisations/profile-fields.tsx` may register product fields through the managed organisation profile form's `FormProvider`. `organisations/profile-extension.ts` owns the matching Zod schema, initial-value loader, and authorised mutation. Keep both files aligned: the server validates every extension payload and calls the mutation only after the canonical owner/admin update succeeds.

`organisations/pages.tsx` may preserve product chooser, team, or billing behaviour and register product-only settings sections. Register the matching navigation entries in `organisations/navigation.ts`; IDs must be unique kebab-case values and cannot replace Core `profile`, `team`, or `billing` sections. `organisations/chrome.tsx` wraps the managed settings shell in product application chrome and is the appropriate place for a stronger product access boundary. Keep product colours and presentation in the developer-owned `src/styles/supacharger-organisations.css` rather than modifying managed route or shell files.

Managed account and organisation JSX exposes semantic class hooks only. Keep complete account presentation in `src/styles/supacharger-account.css` and complete organisation presentation in `src/styles/supacharger-organisations.css`; both files are developer-owned and preserved by CLI updates.
