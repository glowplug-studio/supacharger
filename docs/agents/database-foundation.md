# Database, profiles, and storage contract

## Schema boundary

Reusable internal tables live in `app`. Browser-callable functions live in `api`; service-role-only Stripe, webhook, and migration functions live in `api_edge`. PostgREST exposes `api` and `api_edge`, while `app` remains unexposed. Every internal table uses RLS as defence in depth even when it has no browser grants.

## One profile per Auth user

`app.profiles.id` is the `auth.users.id` primary key. The shared fields are:

- `first_name` and `last_name` for profile completion, plus nullable `username` when the configured identity policy enables it;
- `email`, synchronised from Supabase Auth and returned only to the profile owner;
- `avatar_path` and `header_image_path` for private profile media;
- `language_code` for the validated two-letter preference; and
- `created_at` and `updated_at`.

Consumers may add application-specific fields to `app.profiles` or a one-to-one extension. They must not add a second shared user/profile table. The Auth insert and email-update triggers always upsert the canonical row, independently of routing configuration. The forward profile-repair migration also inserts any row missing from an older installation that created Auth users before those triggers existed. It leaves username null so the configured identity and onboarding policy remains authoritative, and never overwrites an existing profile.

## Profile identity and completion

`PROFILE_IDENTITY.USERNAME` is `disabled`, `optional`, or `required`. The database column and case-insensitive partial uniqueness remain installed and nullable in every mode. Disabled applications omit the form field, public username route, and username display. Optional applications accept a blank value. Required applications validate and include it in completion.

`api.is_profile_complete_by_current_user(input_username_required boolean default false)` always requires non-empty names and requires username only when the caller passes true. `POST_SIGN_IN_ONBOARDING.REQUIRED` enables the callback and protected server-layout redirect; `REDIRECT_PATH` selects the developer-owned setup page. Disabling enforcement does not disable the profile trigger or profile APIs.

Identity display uses the shared projection in this order: first and last name; populated username when policy permits it; owner-only email; `Account`. Email never enters the general/public profile projection.

## Optional organisation management

`app.organisations`, `app.organisation_members`, `app.organisation_invitations`, `app.organisation_access_requests`, and `app.user_session_contexts` are installed in every aligned application. They have RLS, no browser table grants, and narrow Auth-hook/service-role access. `ORGANISATIONS.ENABLED` controls whether application routes and adapters expose the capability. Disabling it does not drop schema.

Authenticated application code calls `api.organisations(input_payload)`. The dispatcher derives the current user, verified email, and Auth `session_id` from the JWT and supports list, handle availability, create, switch, read, update, member management, invitation management, and access-request review. Clients never supply identity or session IDs. Roles are `owner`, `admin`, and `member`; the last owner cannot be removed or demoted. Specdrive's semantic adapter maps Core `member` to its existing product `contributor` value without changing Core's contract.

Handles are normalised and rejected when they collide with reserved application routes. Invitations store only a SHA-256 token hash, normalise the recipient email, expire, can be revoked, and are single use. Acceptance requires the signed-in Auth email to match. An organisation with `access_policy: 'request'` creates a pending request for manager review; requesting access never creates membership directly.

The private `organisation-logos` bucket accepts JPEG, PNG, WebP, and GIF objects up to 5 MB. Organisation managers control writes under the organisation UUID prefix; members can read their organisation's media. Creating an organisation synchronises its organisation billing subject. Membership and role changes invalidate stale active contexts, while context-changing actions return `requiresSessionRefresh` so callers refresh the Supabase session before trusting organisation claims.

## Profile visibility

The current-user RPC may return the owner's email and complete shared profile fields. `api.get_user_profiles_by_identifiers()` is the safe general projection for verified authenticated users: it matches UUID or username and returns only ID, names, username, avatar path, and header path. Never add email to this projection.

Application chrome uses `api.get_account_summary_by_current_user()` rather than composing separate profile and organisation queries in the browser. It returns one JSON object containing the authenticated user ID, email, names, username, avatar storage path, active organisation, and organisation count. The RPC never signs media and maps the active role to `owner`, `admin`, or `member`. `src/supacharger/account/account-summary.ts` verifies Auth once, validates the RPC payload, derives display identity, and batch-signs only the media the summary needs. The managed `GET /api/account/summary` route exposes that safe result with private no-store caching.

Menus remain developer-owned but consume the managed `useAccountSummary()` hook. After a successful profile or avatar database mutation, call `publishAccountSummaryChanged()`; it emits `supacharger:account-summary-changed` and causes mounted consumers to reload the canonical summary. An optimistic caller may publish a complete replacement summary. Do not dispatch product-specific profile-refresh events or make menus query profile tables directly.

## Private media

The `user-avatars` bucket is private and accepts JPEG, PNG, and WebP files up to 5 MB. Canonical object keys are:

- `<auth-user-id>/avatar-<unique-name>`; and
- `<auth-user-id>/headers/header-<unique-name>`.

Only the owner may insert, update, or delete within those prefixes. Verified authenticated users may read allowed profile objects from the private bucket and clients render them with signed URLs. Use the shared signed-media resolver when a server surface needs several private objects: it groups paths by bucket and uses `createSignedUrls()` once per bucket instead of issuing one request per image. A consumer may add a server-side signing proxy for intentionally public product profiles, but must not make the bucket public or store permanent public URLs.

Use the authenticated `process-image-upload` Edge Function for shared resizing/re-encoding. Its `profile_avatar` and `profile_header` targets generate these canonical paths with the caller's RLS-scoped Storage client. The request never supplies a bucket or path. See `docs/agents/image-transformation.md` for the target and extension contract.

## Migration verification

Exposed `api`, `api_edge`, and `mcp_api` RPC arguments must not use a `p_` prefix. Prefer descriptive names. Use `input_` where an argument could collide with a column, local variable, or result field, and use `result_limit` for row limits. Qualify SQL identifiers to make ambiguity impossible. A rename migration must preserve the exact function signature types, defaults, security mode, `search_path`, owner, comments, grants, and dependencies; update generated types, every caller, OpenAPI, and Bruno together.

Create migrations with `supabase migration new`, rebuild a clean local database, run `supabase db lint --local`, and regenerate TypeScript types from `public,api,api_edge,app`. Update current-user callers, general profile callers, storage upload paths, protected server-access checks, Bruno requests, and human documentation in the same change.
