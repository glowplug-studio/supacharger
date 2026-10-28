# Profile identity and post-sign-in onboarding

## Stable policy

`PROFILE_IDENTITY.USERNAME` has three values: `disabled`, `optional`, and `required`. Storage remains installed and nullable. Treat this as a presentation, routing, validation, and completion policy—not a migration toggle.

`POST_SIGN_IN_ONBOARDING` is separate. `REQUIRED` enables the callback and protected server-layout guard; `REDIRECT_PATH` points to a real developer-owned page. Core ships `/account/setup-profile` as the generic name/username adapter. Consumers may retain product-specific UI and fields at their configured route while using the same completion RPC.

`requireOnboardedUser()` and `requireAppAccess()` call `api.is_profile_complete_by_current_user({ input_username_required: PROFILE_IDENTITY.USERNAME === 'required' })`; the callback applies the same policy before billing. Never infer completion from Auth metadata, and never make username required merely because the column exists. Proxy does not perform this database check.

Place the setup page beneath `requireVerifiedUser()`, never beneath `requireOnboardedUser()` or `requireAppAccess()`. An incomplete verified user must be able to reach and submit the form without being redirected back to it.

## Extension seams

CLI-managed code owns the journey contract and generic adapter interfaces. Application code owns branding, media, additional profile fields, organisation creation, and post-authentication product steps under `src/supacharger.adapters/` or other manifest-declared developer paths. The CLI must preserve those files.

Application-specific adoption notes are recorded in [project integration guidance](project/consumer-integration.md). Preserve this topic’s shared contract when adapting product behaviour.