# Authenticated image transformation

## Trust boundary

`process-image-upload` is a globally deployable Supabase Edge Function for signed-in users. Keep `verify_jwt = true` and authenticate again in the handler with `withSupabase({ auth: 'user' })`. Upload through `context.supabase`, which carries the user's bearer token and remains subject to Storage RLS. Do not use `context.supabaseAdmin`, `SUPABASE_SECRET_KEYS`, `SUPABASE_SERVICE_ROLE_KEY`, or another privileged client for this flow.

The multipart request contains exactly:

- `file`: a JPEG, PNG, or WebP source image; and
- `target`: a key from the checked-in target map; and
- optionally `destination`: a relative directory below the authenticated user's ID; and
- optionally `crop`: a JSON text rectangle in oriented source pixels.

Reject absolute destinations, leading or trailing slashes, `.` or `..` segments, unsafe characters and values over 256 characters. Never accept bucket names, filenames, output formats, output dimensions, quality, compression, visibility, cache policy, or ownership IDs from the request. Assume any authenticated user can invoke every configured target and destination directly; Storage RLS must remain authoritative.

The selected target always resolves the bucket and fallback path. A valid destination replaces only that fallback path beneath `<auth-user-id>/`.


## Selecting a source crop

Send an optional `crop` multipart **text** field containing JSON with exactly `x`, `y`, `width` and `height`. Values are safe integers in original-image pixels **after EXIF orientation**, measured from the top-left before resizing. `x` and `y` are non-negative; width and height must be positive. The rectangle must fit entirely inside the oriented source. Do not send CSS/display pixels, percentages, a focal point alone, or output dimensions.

```ts
body.set('crop', JSON.stringify({ x: 0, y: 250, width: 1000, height: 375 }));
```

This selects a 1000×375 horizontal strip starting 250 pixels down a 1000×1000 source. A frontend cropper must map its preview selection back to oriented source pixels. Crop selection and zoom UI remain application-owned.

The processor checks the complete source byte/pixel limits, auto-orients, validates and extracts the rectangle, then applies the target's existing resize/encoding policy without upscaling. `inside` preserves the selected aspect ratio; `cover` may centre-crop it again to match the configured target ratio. For an exact header selection, use the target ratio in the cropper or an application-owned `inside` target. Omitting `crop` preserves previous behaviour.

Malformed JSON, extra crop properties, non-integer values, duplicate fields, file-valued crop fields and crop text over 256 characters return `400`. An otherwise valid rectangle outside the oriented source returns `422` before any Storage operation. Responses and Storage authorisation are unchanged. Deploy the updated Edge Function before enabling crop submission in a consumer.

## Ownership

These files are CLI-managed:

- `supabase/functions/_shared/image-target-contract.ts` validates target policy;
- `supabase/functions/_shared/image-transform.ts` decodes, orients, resizes, strips metadata, re-encodes, and stores the image; and
- `supabase/functions/process-image-upload/index.ts` owns the authenticated HTTP contract, with Zod multipart parsing in `request.ts`.

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
npx supabase functions serve process-image-upload
npx supabase functions deploy process-image-upload
```

Exercise unauthenticated, unsupported-target, unsafe-destination, malformed-crop, out-of-bounds-crop, rotated-source, invalid-image, byte-limit, pixel-limit, JPEG, PNG, private signed-URL, and Storage-policy failure cases before deployment. The checked-in `magick.wasm` is declared through `static_files`; deploy with Docker because API-only deployment cannot bundle static files. Large image processing is bounded by hosted Edge Function memory and CPU limits; keep source files at or below 5 MiB unless a reviewed product target has a stricter reason to increase it.

## Source dimension policy

Targets may set `minInputWidth` and `minInputHeight` (positive integers up to 4096). The processor checks these after EXIF orientation and optional cropping, before resizing; undersized sources return 422. Omitted minimums preserve existing behaviour. `maxInputPixels` defaults to 25 million; an explicit `null` disables the configured pixel cap for that target. Byte, format and decode checks still apply, and very large sources can exceed runtime resources. This policy is server-owned and cannot be overridden by multipart fields. Deploy the updated processor before enabling these target options.
