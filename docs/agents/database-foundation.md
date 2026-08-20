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

Consumers may add application-specific fields to `app.profiles` or a one-to-one extension. They must not add a second shared user/profile table. The Auth insert and email-update triggers always upsert the canonical row, independently of routing configuration.

## Profile identity and completion

`PROFILE_IDENTITY.USERNAME` is `disabled`, `optional`, or `required`. The database column and case-insensitive partial uniqueness remain installed and nullable in every mode. Disabled applications omit the form field, public username route, and username display. Optional applications accept a blank value. Required applications validate and include it in completion.

`api.is_profile_complete_by_current_user(p_username_required boolean default false)` always requires non-empty names and requires username only when the caller passes true. `POST_SIGN_IN_ONBOARDING.REQUIRED` enables the callback and route-guard redirect; `REDIRECT_PATH` selects the developer-owned setup page. Disabling enforcement does not disable the profile trigger or profile APIs.

Identity display uses the shared projection in this order: first and last name; populated username when policy permits it; owner-only email; `Account`. Email never enters the general/public profile projection.

## Dormant organisation foundation

`app.organisations`, `app.organisation_members`, and `app.user_session_contexts` are installed in every aligned application. They have RLS, no browser table grants, and narrow Auth-hook/service-role access. `ORGANISATIONS.ENABLED` controls whether application routes and adapters expose the capability. Disabling it does not drop schema. Creation and selection occur through service-only `api_edge` functions after a verified user and session have been established.

## Profile visibility

The current-user RPC may return the owner's email and complete shared profile fields. `api.get_user_profiles_by_identifiers()` is the safe general projection for verified authenticated users: it matches UUID or username and returns only ID, names, username, avatar path, and header path. Never add email to this projection.

## Private media

The `user-avatars` bucket is private and accepts JPEG, PNG, and WebP files up to 5 MB. Canonical object keys are:

- `<auth-user-id>/avatar-<unique-name>`; and
- `<auth-user-id>/headers/header-<unique-name>`.

Only the owner may insert, update, or delete within those prefixes. Verified authenticated users may read allowed profile objects from the private bucket and clients render them with signed URLs. A consumer may add a server-side signing proxy for intentionally public product profiles, but must not make the bucket public or store permanent public URLs.

## Migration verification

Create migrations with `supabase migration new`, rebuild a clean local database, run `supabase db lint --local`, and regenerate TypeScript types from `public,api,api_edge,app`. Update current-user callers, general profile callers, storage upload paths, route guards, Bruno requests, and human documentation in the same change.
