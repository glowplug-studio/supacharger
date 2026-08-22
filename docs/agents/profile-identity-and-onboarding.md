# Profile identity and post-sign-in onboarding

## Stable policy

`PROFILE_IDENTITY.USERNAME` has three values: `disabled`, `optional`, and `required`. Storage remains installed and nullable. Treat this as a presentation, routing, validation, and completion policy—not a migration toggle.

`POST_SIGN_IN_ONBOARDING` is separate. `REQUIRED` enables the callback and Proxy guard; `REDIRECT_PATH` points to a real developer-owned page. Core ships `/account/setup-profile` as the generic name/username adapter. Consumers may retain product-specific UI and fields at their configured route while using the same completion RPC.

The server access guard calls `api.is_profile_complete_by_current_user({ username_required: PROFILE_IDENTITY.USERNAME === 'required' })`. Never infer completion from Auth metadata, and never make username required merely because the column exists. Proxy does not perform this database check.

## Extension seams

CLI-managed code owns the journey contract and generic adapter interfaces. Application code owns branding, media, additional profile fields, organisation creation, and post-authentication product steps under `src/supacharger.adapters/` or other manifest-declared developer paths. The CLI must preserve those files.

Keep Wakekeeper and Specdrive's established profile-setup presentation. SnapScreen has onboarding disabled. Shared visual auth changes apply to core, SnapScreen, and Wakekeeper; Specdrive retains its authorised Untitled UI presentation while its non-visual config, RPC, and database contracts remain aligned.
