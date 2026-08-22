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

`api.is_profile_complete_by_current_user(input_username_required boolean default false)` always requires non-empty names and requires username only when the caller passes true. `POST_SIGN_IN_ONBOARDING.REQUIRED` enables the callback and protected server-layout redirect; `REDIRECT_PATH` selects the developer-owned setup page. Disabling enforcement does not disable the profile trigger or profile APIs.

Identity display uses the shared projection in this order: first and last name; populated username when policy permits it; owner-only email; `Account`. Email never enters the general/public profile projection.

## Dormant organisation foundation

`app.organisations`, `app.organisation_members`, and `app.user_session_contexts` are installed in every aligned application. They have RLS, no browser table grants, and narrow Auth-hook/service-role access. `ORGANISATIONS.ENABLED` controls whether application routes and adapters expose the capability. Disabling it does not drop schema. Authenticated application code calls `api.organisations(input_payload)` with `action: 'create'` or `action: 'switch'`; the dispatcher derives the current user and Auth `session_id` from the verified JWT and delegates to service-only `api_edge` functions. Clients never supply identity or session IDs.

## Profile visibility

The current-user RPC may return the owner's email and complete shared profile fields. `api.get_user_profiles_by_identifiers()` is the safe general projection for verified authenticated users: it matches UUID or username and returns only ID, names, username, avatar path, and header path. Never add email to this projection.

## Private media

The `user-avatars` bucket is private and accepts JPEG, PNG, and WebP files up to 5 MB. Canonical object keys are:

- `<auth-user-id>/avatar-<unique-name>`; and
- `<auth-user-id>/headers/header-<unique-name>`.

Only the owner may insert, update, or delete within those prefixes. Verified authenticated users may read allowed profile objects from the private bucket and clients render them with signed URLs. A consumer may add a server-side signing proxy for intentionally public product profiles, but must not make the bucket public or store permanent public URLs.

Use the authenticated `process-image-upload` Edge Function for shared resizing/re-encoding. Its `profile_avatar` and `profile_header` targets generate these canonical paths with the caller's RLS-scoped Storage client. The request never supplies a bucket or path. See `docs/agents/image-transformation.md` for the target and extension contract.

## Migration verification

Exposed `api`, `api_edge`, and `mcp_api` RPC arguments must not use a `p_` prefix. Prefer descriptive names. Use `input_` where an argument could collide with a column, local variable, or result field, and use `result_limit` for row limits. Qualify SQL identifiers to make ambiguity impossible. A rename migration must preserve the exact function signature types, defaults, security mode, `search_path`, owner, comments, grants, and dependencies; update generated types, every caller, OpenAPI, and Bruno together.

Create migrations with `supabase migration new`, rebuild a clean local database, run `supabase db lint --local`, and regenerate TypeScript types from `public,api,api_edge,app`. Update current-user callers, general profile callers, storage upload paths, protected server-access checks, Bruno requests, and human documentation in the same change.
