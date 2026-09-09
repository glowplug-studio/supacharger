# Authenticated image transformation

## Trust boundary

`process-image-upload` is a globally deployable Supabase Edge Function for signed-in users. Keep `verify_jwt = true` and authenticate again in the handler with `withSupabase({ auth: 'user' })`. Upload through `context.supabase`, which carries the user's bearer token and remains subject to Storage RLS. Do not use `context.supabaseAdmin`, `SUPABASE_SECRET_KEYS`, `SUPABASE_SERVICE_ROLE_KEY`, or another privileged client for this flow.

The multipart request contains exactly:

- `file`: a JPEG, PNG, or WebP source image; and
- `target`: a key from the checked-in target map; and
- optionally `destination`: a relative directory below the authenticated user's ID.

Reject absolute destinations, leading or trailing slashes, `.` or `..` segments, unsafe characters and values over 256 characters. Never accept bucket names, filenames, output formats, dimensions, quality, compression, visibility, cache policy, or ownership IDs from the request. Assume any authenticated user can invoke every configured target and destination directly; Storage RLS must remain authoritative.

The selected target always resolves the bucket and fallback path. A valid destination replaces only that fallback path beneath `<auth-user-id>/`.

## Ownership

These files are CLI-managed:

- `supabase/functions/_shared/image-target-contract.ts` validates target policy;
- `supabase/functions/_shared/image-transform.ts` decodes, orients, resizes, strips metadata, re-encodes, and stores the image; and
- `supabase/functions/process-image-upload/index.ts` owns the authenticated HTTP contract.

`supabase/functions/_shared/image-targets.ts` is developer-owned. The CLI installs starter profile targets when the file is absent and preserves the complete file during updates. Applications may add product targets without forking the transformer.

## Target contract

Every target fixes its Storage bucket, fallback path prefix below `<auth-user-id>/`, filename prefix, output format (`jpeg` or `png`), fit (`inside` or centred `cover`), dimensions, visibility, and relevant encoding settings. It may also lower the default 5 MiB input limit or 25-megapixel decoded limit. Maximum accepted policy values are 10 MiB, 40 megapixels, and 4096 pixels per output dimension.

JPEG uses `qualityPercent` from 1–100 and composites transparency onto white. PNG remains lossless and uses `pngCompressionPercent` from 0–100 to select compression effort. The transformer auto-orients, strips embedded metadata, never upscales, generates a UUID filename, and uploads with `upsert: false`.

Private targets may request a short-lived signed URL for up to 24 hours. Public targets may return a public URL only when the configured bucket is intentionally public. The canonical profile targets remain in the private `user-avatars` bucket.

## Adding a target

Add the complete target to `image-targets.ts`, then confirm:

1. the bucket exists with a matching MIME/size policy;
2. authenticated Storage RLS allows the caller to insert only beneath their own user-ID folder;
3. every configured target is safe for any authenticated caller, even when the normal UI does not expose it;
4. any destination sent by the calling system is relative, user-scoped and permitted by Storage RLS; and
5. README, human documentation, MCP guidance, and API/Bruno documentation describe the new target.

For resource-owned destinations that cannot be safely represented below the current user's folder, create a narrow domain wrapper that verifies current database ownership or membership before calling the shared transformer. Never trust a resource or user ID from form data as proof of ownership.

## Verification

Run:

```bash
npm run test:image-transform
npm run test:image-transform-runtime
npx supabase functions serve process-image-upload
npx supabase functions deploy process-image-upload --use-docker
```

Exercise unauthenticated, unsupported-target, unsafe-destination, invalid-image, byte-limit, pixel-limit, JPEG, PNG, private signed-URL, and Storage-policy failure cases before deployment. The checked-in `magick.wasm` is declared through `static_files`; deploy with Docker because API-only deployment cannot bundle static files. Large image processing is bounded by hosted Edge Function memory and CPU limits; keep source files at or below 5 MiB unless a reviewed product target has a stricter reason to increase it.
