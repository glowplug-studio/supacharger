# Supacharger application adapters

This directory is developer-owned and preserved by `supacharger coreupdate`.

Use it for application-specific authentication context and post-sign-in onboarding adapters. The authentication adapter collects extra context and selects it only after sign-in. The onboarding adapter declares product fields and completes authenticated work such as organisation creation before returning an optional destination. The core owns the journey and adapter interfaces; the application owns product fields, organisation-specific decisions, destinations, and presentation.

Do not place credentials here or rely on client-side adapter checks for authorisation.

`auth/auth-sidecar.tsx` owns the product side of the managed split authentication shell. Export `AuthSidecar` for the desktop sidecar and `AuthMobileBrand` for the compact brand shown above forms on smaller screens. The CLI preserves both exports during updates.
