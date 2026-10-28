# Profile extensions and media

Core owns account identity, language, profile visibility and media paths. Product applications own additional fields and resource-specific visibility. Do not introduce a second profile table or duplicate identity RPCs for product additions.

## RPC contracts

- `api.get_account_profile_by_current_user()` returns the caller's profile as a zero-or-one-row array. Shared fields include `profile_is_public`; `extension` contains the application's explicitly selected private fields. Email is owner-only. Anonymous Auth users receive no row.
- `api.update_account_profile_by_current_user(request)` accepts `{profile: {...}, extension: {...}}`. Both objects are optional patches. Omitted keys preserve existing values; null clears only nullable shared fields. Unknown keys and invalid values fail. The account ID comes from the JWT, never the request. Identity, language, visibility and extension writes commit or roll back together. The response is void.
- `api.get_public_account_profile(identifier)` returns a public profile by UUID or handle, or null. Its allow-list is `user_id`, `first_name`, `last_name`, `username`, `avatar_path`, `header_image_path`. It never includes email or private extension fields.
- `get_user_profiles_by_identifiers` remains the existing authenticated identity lookup. Public profile visibility is a separate contract; do not silently apply it to organisation/member identity lookups.
- `api.get_profile_media_url(object_path)` constructs the configured Supabase media URL or returns null for an invalid path/unconfigured origin. It does not authorise a download; Storage does that when the URL is fetched.

## Product hooks

Export `accountProfileExtensionSchema` from the developer-owned `src/supacharger.adapters/account/profile-extension.ts`. Use a strict Zod object with explicit serialisable fields. The managed page parses the returned extension and the managed mutation parses submitted values. There is no separate JavaScript extension write or loader.

In a product forward migration, replace `internal.get_account_profile_extension(account_id uuid)` and `internal.update_account_profile_extension(account_id uuid, extension jsonb)`. The reader returns only intended owner-visible fields. The writer validates every field, checks related-resource ownership and applies patches inside Core's transaction. Preserve the private hooks' revoked client grants. Do not expose a dynamic table name, SQL expression, column list or caller-selected hook. Core's starter accepts only an empty extension.

Additional public product fields require a separately reviewed allow-list in a product endpoint that composes `get_public_account_profile`; never reuse the private extension object. Account extension hooks are distinct from organisation extension adapters.

## Supabase profile media

`GET /functions/v1/profile-media?path=<object-path>` and HEAD serve authorised image bytes from the private `user-avatars` bucket. The function validates its query with Zod, uses the anonymous key with the optional caller Bearer JWT and delegates access to Storage RLS. It never uses a service-role key. The gateway JWT switch is false because public image requests have no JWT; authorisation remains enforced by Storage. A public profile permits only its currently selected avatar/header, not bucket listing. Existing authenticated application media policies remain authoritative.

Responses are private/no-store; private or missing objects return 404 without distinguishing them. Invalid queries return 400 and unsupported methods return 405. Supported file suffixes/MIME types are JPEG, PNG, WebP and AVIF. The object path must be `<uuid>/avatar-<name>.<suffix>` or `<uuid>/headers/header-<name>.<suffix>`, with letters, digits, underscores and hyphens in the name. Image tags do not forward an application session to another origin: use the existing caller-scoped signed-media helper for private images, or fetch with a Bearer token. Existing signed URLs remain valid until expiry.

Deploy the Core-managed `supabase/functions/profile-media` function and configure the database origin once per environment using a privileged deployment connection:

```sql
insert into internal.profile_media_settings (supabase_url)
values ('https://YOUR_PROJECT.supabase.co')
on conflict (profile_media_setting_id) do update set supabase_url=excluded.supabase_url;
```

Use the actual local API origin for local development. Do not derive this origin from request headers. The table is private, contains no credentials and is not client-writable. Application code may use `profileMediaUrl(path)`, which uses the configured Supabase URL. Persist object paths, never expiring signed URLs.

## Coordinated upgrades

This contract has no old-signature overload or application media-route alias. Apply the shared migration before product hook migrations, regenerate database types, update every caller and deploy consumers with the database cutover. Do not mark a Core lock as upgraded until its source revision exists. Keep Core-managed source and Bruno requests identical across consumers; preserve developer-owned adapters and product validation. Verify rollback on invalid extension and related-resource updates, anonymous/private/public access, and media privacy changes.
