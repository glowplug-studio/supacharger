# Social profile initialisation — 27 October 2026

## Implemented behaviour

Verified social OAuth callbacks initialise untouched profiles before existing onboarding checks. The current user's latest social identity supplies structured names, with an editable full-name fallback. Optional onboarding still saves available data silently. Usernames, privacy, billing, MFA and product requirements remain unchanged.

Pictures use a provider-host allowlist, bounded HTTPS downloads and the existing authenticated process-image-upload target. Objects remain private in user-avatars. A one-time private import marker prevents later overwrites/re-imports; explicit name/avatar edits cancel pending imports. Previously edited profiles are not backfilled. Failed or unsupported pictures do not prevent sign-in and can be uploaded manually afterwards. An uncertain completion response never deletes a potentially attached image; an orphan may require later reference-aware cleanup.

## Verification and deployment

- TypeScript passes in Core, SnapScreen, Wakekeeper and Specdrive.
- Scoped lint passes for new shared helpers/callbacks and changed project pages.
- All 29 Core tests pass, including callback ordering and recovery/email bypass. New tests cover URL boundaries, redirects, MIME/streaming limits, failure/conflict/uncertain completion and repeat-import behaviour.
- Core SQL fixtures were run against the aligned Specdrive local database inside rolled-back transactions: structured/fallback names, owned images, foreign-path rejection, edited profiles, repeat calls, avatar removal during import and anonymous rejection passed.
- Specdrive local api/app database lint passes. The new table and RPC types were generated from that database and only the new declarations incorporated, preserving unrelated consumer types.
- Both new migrations were applied and recorded only in Specdrive's running local database. Its unrelated pending historical migrations were not applied. Core, SnapScreen and Wakekeeper local stacks were unavailable; their migrations are pending.
- All six changed exact-managed files hash-match Core in every consumer. Core-lock revisions were not advanced to unpublished work. Existing unrelated working-tree changes were preserved.
- Docusaurus build:local passes with existing blog/metadata warnings. Specdrive's English catalogue check passes. No new translation keys or secondary translations were required.
- New OpenAPI operation fragments and Wakekeeper YAML requests parse. Full Specdrive OpenAPI parsing remains blocked by a pre-existing duplicate organisation path key (also present in HEAD).
- No consumer tests, fixtures or test scripts were added. No browser OAuth run, hosted migrations, deployment or application production build was performed.

Apply both forward migrations before releasing the callback in each environment. Ensure the existing process-image-upload function and profile_avatar target are deployed. Do not replay or rewrite historical migrations. No new configuration option or environment variable is needed.

## Files changed in this project

- `src/app/(supacharger)/(unauthenticated)/auth/callback/route.ts`
- `src/supacharger/profile/initialise-social-profile.ts`
- `src/supacharger/profile/social-avatar-source.ts`
- `src/lib/supabase/types.ts`
- `supabase/migrations/20261026175309_social_profile_initialisation.sql`
- `supabase/migrations/20261026180100_guard_social_avatar_import_edits.sql`
- `docs/agents/database-foundation.md`
- `docs/bruno/supacharger-rpc/README.md`
- `docs/bruno/supacharger-rpc/initialise_social_profile_by_current_user.bru`
- `docs/bruno/supacharger-rpc/complete_social_avatar_by_current_user.bru`
- `src/app/(project)/(verified)/account/setup-profile/page.tsx`
- `test/auth-recovery.test.mjs`
- `test/social-profile.test.mjs`
- `test/sql/social-profile-initialisation.sql`

## Consumer integration and documentation

SnapScreen now has the verified-only setup route for future onboarding configuration; its current REQUIRED=false value is preserved. Wakekeeper reuses its product profile loader on both setup and edit pages, preserving product fields. Specdrive preserves Untitled UI and its setup page now honours optional username configuration.

The Docusaurus database-profiles-and-storage page documents the feature. Wakekeeper's separately versioned API-specification repository adds initialise_social_profile_by_current_user.yml and complete_social_avatar_by_current_user.yml, updates get_profile.yml and its supabase-bruno-sync.md record. Specdrive's product Bruno collection uses its existing SUPABASE_ANON_KEY environment variable; the managed Core collection uses SUPABASE_PUBLISHABLE_KEY.

Provider identity data was checked against [Supabase identity documentation](https://supabase.com/docs/guides/auth/identities). Names/pictures are presentation defaults, never authorisation data.

## Consumer file manifests

### snapscreen-supacharger-app

- `src/app/(supacharger)/(unauthenticated)/auth/callback/route.ts`
- `src/supacharger/profile/initialise-social-profile.ts`
- `src/supacharger/profile/social-avatar-source.ts`
- `src/lib/supabase/types.ts`
- `supabase/migrations/20261026175309_social_profile_initialisation.sql`
- `supabase/migrations/20261026180100_guard_social_avatar_import_edits.sql`
- `docs/agents/database-foundation.md`
- `docs/bruno/supacharger-rpc/README.md`
- `docs/bruno/supacharger-rpc/initialise_social_profile_by_current_user.bru`
- `docs/bruno/supacharger-rpc/complete_social_avatar_by_current_user.bru`
- `src/app/(project)/(verified)/layout.tsx`
- `src/app/(project)/(verified)/account/setup-profile/page.tsx`


### wakekeeper-spacharger-app

- `src/app/(supacharger)/(unauthenticated)/auth/callback/route.ts`
- `src/supacharger/profile/initialise-social-profile.ts`
- `src/supacharger/profile/social-avatar-source.ts`
- `src/lib/supabase/types.ts`
- `supabase/migrations/20261026175309_social_profile_initialisation.sql`
- `supabase/migrations/20261026180100_guard_social_avatar_import_edits.sql`
- `docs/agents/database-foundation.md`
- `docs/bruno/supacharger-rpc/README.md`
- `docs/bruno/supacharger-rpc/initialise_social_profile_by_current_user.bru`
- `docs/bruno/supacharger-rpc/complete_social_avatar_by_current_user.bru`
- `src/app/(project)/(verified)/account/setup-profile/page.tsx`
- `src/app/(project)/(authenticated)/account/edit-profile/page.tsx`
- `src/features/profile/server/get-initial-profile-values.ts`

### specdrive-supacharger-app

- `src/app/(supacharger)/(unauthenticated)/auth/callback/route.ts`
- `src/supacharger/profile/initialise-social-profile.ts`
- `src/supacharger/profile/social-avatar-source.ts`
- `src/lib/supabase/types.ts`
- `supabase/migrations/20261026175309_social_profile_initialisation.sql`
- `supabase/migrations/20261026180100_guard_social_avatar_import_edits.sql`
- `docs/agents/database-foundation.md`
- `docs/bruno/supacharger-rpc/README.md`
- `docs/bruno/supacharger-rpc/initialise_social_profile_by_current_user.bru`
- `docs/bruno/supacharger-rpc/complete_social_avatar_by_current_user.bru`
- `src/app/(project)/(verified)/account/setup-profile/page.tsx`
- `README.md`
- `docs/api/supabase-rpc.openapi.yaml`
- `docs/bruno/rhd-deliveryos-rpc/initialise_social_profile_by_current_user.bru`
- `docs/bruno/rhd-deliveryos-rpc/complete_social_avatar_by_current_user.bru`


Each project also contains this task’s `.agents/reports/social-profile-initialisation.md` handoff.

Username behaviour is extended by the approved follow-up in `email-username-initialisation.md`; the original statement that usernames are unchanged describes the earlier social-only implementation.
