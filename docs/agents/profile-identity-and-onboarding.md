# Profile identity and post-sign-in onboarding

## Stable policy

`PROFILE_IDENTITY.USERNAME` has three values: `disabled`, `optional`, and `required`. Storage remains installed and nullable. Treat this as a presentation, routing, validation, and completion policy—not a migration toggle.

`POST_SIGN_IN_ONBOARDING` is separate. `REQUIRED` enables the callback and protected server-layout guard; `REDIRECT_PATH` points to a real developer-owned page. Core ships `/account/setup-profile` as the generic name/username adapter. Consumers may retain product-specific UI and fields at their configured route while using the same completion RPC.

`requireOnboardedUser()` and `requireAppAccess()` call `api.is_profile_complete_by_current_user({ input_username_required: PROFILE_IDENTITY.USERNAME === 'required' })`; the callback applies the same policy before billing. Never infer completion from Auth metadata, and never make username required merely because the column exists. Proxy does not perform this database check.

Place the setup page beneath `requireVerifiedUser()`, never beneath `requireOnboardedUser()` or `requireAppAccess()`. An incomplete verified user must be able to reach and submit the form without being redirected back to it.

## Username default allocation

When usernames are optional or required, Core initialises a blank profile username before onboarding and on protected application entry. `generateUsername()` is a standalone utility: it combines a prefix and suffix from developer-owned lists and does not depend on authentication, configuration, or storage. The starter lists contain 30 colour prefixes and 100 animal suffixes; applications may customise them.

The callback passes a generated candidate as `fallback_username` to `api.initialise_account_username_by_current_user(fallback_username)`. SQL derives the actor and email from the authenticated request. It lowercases the email portion before `@` and removes characters other than ASCII letters, digits, `_`, and `-`. A sanitised email value is used only when its length is 3–40; otherwise the generated candidate is used. If the email value conflicts, SQL switches to the generated candidate. Further collisions append numeric suffixes beginning at `1`, within the 40-character maximum.

The case-insensitive unique index and retry loop make allocation safe under concurrent requests. Existing non-empty usernames are returned unchanged. The private one-time initialisation ledger prevents repeated allocation and preserves a deliberate username removal; this path does not bulk-backfill existing blank profiles. When `USERNAME` is `disabled`, the application does not call the allocator.

## Extension seams

CLI-managed code owns the journey contract and generic adapter interfaces. Application code owns branding, media, additional profile fields, organisation creation, and post-authentication product steps under `src/supacharger.adapters/` or other manifest-declared developer paths. The CLI must preserve those files.

Application-specific adoption notes are recorded in [project integration guidance](project/consumer-integration.md). Preserve this topic’s shared contract when adapting product behaviour.
