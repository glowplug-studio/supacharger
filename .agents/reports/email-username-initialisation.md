# Email-derived username defaults — 27 October 2026

## Behaviour

With username policy optional or required, persist a lowercase ASCII-alphanumeric username derived from the email local part. Strip dots, punctuation, underscores and hyphens. Use `user` when fewer than three characters remain; cap at 40 and append a numeric suffix for case-insensitive collisions. The database unique index and retry loop protect concurrent allocation/manual edits. Keep existing names and manual removals. Historical edited blank profiles are excluded by migration; missing email can be initialised later. Disabled username applications skip the RPC.

OAuth allocates after social name/picture import and before onboarding. Protected app/onboarding boundaries cover email sign-ins and optional onboarding; setup pages load stored defaults after allocation. Proxy and the verified-only identity guard remain unchanged. A separate private marker and username-edit trigger preserve intentional removal. No configuration shape, environment variable or manual username validation changes.

## Checks and remaining deployment

- All 30 Core Node tests pass, including enabled/disabled username policy, onboarding independence and callback ordering.
- Rolled-back SQL checks pass for sanitisation, collisions, short-prefix fallback, 40-character bounds, repeat calls, manual names, removal and anonymous rejection.
- Two simultaneous local allocation sessions obtained distinct valid usernames; temporary Auth users were deleted afterwards.
- TypeScript passes in all four projects; scoped lint passes. Specdrive English catalogue validation passes.
- Specdrive local api/app database lint passes. Only the new generated RPC/table declarations were incorporated from local type generation.
- Docusaurus build:local passes with existing blog/metadata warnings. The new OpenAPI fragment and Wakekeeper request YAML validate; the pre-existing duplicate path in the full Specdrive OpenAPI remains unrelated and unresolved.
- Changed exact-managed files match Core byte-for-byte in all consumers. Application values and unrelated dirty work remain preserved; locks were not advanced to unpublished revisions.
- The new forward migration is applied/recorded in Specdrive local only. Core, SnapScreen and Wakekeeper local stacks were not running. Hosted migrations/deployment and browser sign-in testing remain outstanding. Apply this migration after both earlier social-profile migrations before deploying the callers.

## Files changed in this project

- `src/app/(supacharger)/(unauthenticated)/auth/callback/route.ts`
- `src/supacharger/auth/server-access.ts`
- `src/supacharger/profile/initialise-account-username.ts`
- `docs/bruno/supacharger-rpc/initialise_account_username_by_current_user.bru`
- `docs/bruno/supacharger-rpc/README.md`
- `src/lib/supabase/types.ts`
- `supabase/migrations/20261026181542_initialise_email_usernames.sql`
- `docs/agents/database-foundation.md`
- `src/app/(project)/(verified)/account/setup-profile/page.tsx`
- `test/auth-recovery.test.mjs`
- `test/social-profile.test.mjs`
- `test/sql/email-username-initialisation.sql`

## Other documentation

Updated the Docusaurus `docs/Application Development/database-profiles-and-storage.md` page. In the separate `wakekeeper-api-specs-bruno` repository, added `Wakekeeper/collections/Supabase/initialise_account_username_by_current_user.yml` and updated `Wakekeeper/docs/supabase-bruno-sync.md`. Each consumer has its own report and exact changed-file list at `.agents/reports/email-username-initialisation.md`.
