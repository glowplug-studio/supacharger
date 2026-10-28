# Server-authorised image uploads

## Flow and ownership

The browser requests an upload permit from `POST /api/images/authorise` using the current application session. The small JSON request contains `target`, optional `destination` and `crop`, and the source file's `bytes`, `mimeType` and SHA-256 `sha256`. The handler verifies the user, rejects anonymous Auth identities and checks the request Origin. Unknown fields, unsupported targets, invalid metadata and unsafe relative destinations are rejected before signing.

Application settings live in developer-owned `src/supacharger.adapters/media/image-targets.ts`. The Next.js server selects the target's dimensions, fit, encoding, compression, bucket, path prefix, filename prefix, visibility and limits. The browser cannot supply these settings. Keep the project widget policy aligned with these server settings.

The server signs a five-minute permit with HMAC-SHA256. It binds the exact settings, crop, source hash, source size/MIME and authenticated user ID. The browser sends the original image directly to `process-image-upload-v2`, avoiding Vercel's 4.5MB request-body limit. Use `uploadImage` from `src/supacharger/media/upload-image.ts`; existing project widget helpers delegate to it. The browser receives a signature, never the signing secret.

The generic Edge Function accepts exactly three multipart fields: `file`, `permit` and `signature`. It verifies the user's JWT, signature, permit expiry, account binding, supported parameter ranges and source hash before transforming the image. It contains no product target map. Adding a target or changing its sizes requires updating the app server, not redeploying the processor or WASM.

Storage operations still use the user's authenticated Supabase client and RLS. No service-role storage client is used. Paths always start with the authenticated user's ID. A permit is reusable for the same file/user until expiry; it is not a single-use token. Uploads use generated filenames and `upsert: false`. Domain-specific resource ownership checks belong in a narrow app server handler before signing; a client-supplied resource ID is never ownership evidence.

## Processing

JPEG, PNG and WebP inputs are supported. Byte and decoded-pixel limits apply before cropping. The processor auto-orients, validates the crop, resizes without upscaling, strips metadata and encodes JPEG or PNG. Crop coordinates are oriented source pixels (integers after EXIF orientation), with non-negative x/y and positive width/height. The rectangle must fit entirely inside the source.

Targets support `inside` and `cover`, output dimensions up to 4096px, JPEG quality 1–100 and PNG compression 0–100. `cover` requires both dimensions. Minimum input dimensions apply to the oriented image or selected crop. Default input limits are 5MiB and 25 megapixels; policy limits cannot exceed 10MiB or 40 megapixels. An explicit null pixel cap retains the existing opt-out, but runtime resource limits still apply. Public/private visibility and optional signed URL lifetime remain server-owned.

## Configuration and rollout

Generate a separate random `IMAGE_UPLOAD_SIGNING_SECRET` of at least 32 bytes per Supabase project. Configure the identical value in the app's server environment and Supabase Edge secrets. Never prefix it with NEXT_PUBLIC_, commit it, include it in a browser bundle or reuse a service-role key for signing. Configure matching secrets for local development as well. Rotating it invalidates outstanding permits.

The old policy file was `supabase/functions/_shared/image-targets.ts`. Move its complete customised contents into the new server adapter and update imports to the shared target contract. The CLI upgrade preserves an existing new adapter; when absent, it migrates the old policy without discarding product settings. Review project-owned upload wrappers and update them to the managed upload helper. Existing widget files are preserved by Core updates.

Deploy `process-image-upload-v2` with Docker so the existing `magick.wasm` static asset is included:

```sh
npx supabase secrets set --env-file <private-secret-file> --project-ref <project-ref>
npx supabase functions deploy process-image-upload-v2 --project-ref <project-ref>
```

Deploy the updated app after the new function and matching secret are ready. The previous hosted `process-image-upload` endpoint may remain during this transition for already-deployed clients; remove it only after verifying all clients have migrated. The new source does not implement an unsigned legacy fallback. Do not replace the old hosted endpoint early and break current clients. No database migration is required for signed permits.

## Responses and verification

Success retains target, bucket, path, width, height, bytes, content_type and configured public/signed URLs. Persist the returned location using the existing domain save flow.

The authorisation route returns 400 for invalid inputs, 401 for missing/anonymous sessions, 403 for an invalid Origin, 413 for metadata bodies over 4096 bytes and 503 when signing is unconfigured. Success is marked no-store.

Edge returns 400 for malformed/unknown/duplicate multipart fields; 401 for invalid authentication; 403 for invalid, expired, wrong-account or mismatched-file permits; 405 for unsupported methods; 413 for oversized input; 415 for unsupported image formats; 422 for invalid images/crops/dimensions/pixel limits; 500 for processing/storage failures; and 503 when signing is unconfigured. Multipart buffering is capped at 10MiB plus 64KiB overhead even without Content-Length.

Verify signatures, altered settings/files, expiry, wrong-account attempts, unsigned calls, malformed metadata, unsafe paths, byte/pixel limits, crop behaviour, source orientation and Storage RLS. Next.js type checking excludes the Deno handler; check its runtime separately. Test existing image fields as well as a newly configured target.
