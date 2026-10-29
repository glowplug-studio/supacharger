/// <reference lib="deno.ns" />

import { withSupabase } from 'npm:@supabase/server@1.4.1';

import { ImageTransformError, supportsImageMimeType, transformAndStoreImage } from '../_shared/image-transform.ts';

import { parseImagePermit, parseImageUploadRequest } from './request.ts';
import { imageSha256, verifyImagePermit } from './permit-crypto.ts';

import 'jsr:@supabase/functions-js/edge-runtime.d.ts';

function errorResponse(error: string, status: number) {
  return Response.json({ error }, { status });
}

Deno.serve(
  withSupabase({ auth: 'user' }, async (request, context) => {
    if (request.method !== 'POST') {
      return errorResponse('Method not allowed.', 405);
    }

    const secret = Deno.env.get('IMAGE_UPLOAD_SIGNING_SECRET') ?? '';
    if (secret.length < 32) return errorResponse('Image uploads are not configured.', 503);
    let formData: FormData;
    try {
      // Bound multipart buffering even when Content-Length is absent or inaccurate.
      const reader = request.body?.getReader();
      if (!reader) return errorResponse('Expected multipart data.', 400);
      const chunks: Uint8Array[] = [];
      let length = 0;
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        length += value.byteLength;
        if (length > 10 * 1024 * 1024 + 65536) {
          await reader.cancel();
          return errorResponse('The source image is too large.', 413);
        }
        chunks.push(value);
      }
      formData = await new Response(new Blob(chunks.map(chunk => new Uint8Array(chunk))), { headers: { 'Content-Type': request.headers.get('Content-Type') ?? '' } }).formData();
    } catch {
      return errorResponse('Expected a multipart form-data request.', 400);
    }

    const options = parseImageUploadRequest(formData);
    if (!options) {
      return errorResponse('Expected one image file and a signed upload permit.', 400);
    }

    if (!await verifyImagePermit(options.permit, options.signature, secret)) return errorResponse('Invalid upload permit.', 403);
    const permit = parseImagePermit(options.permit, context.userClaims!.id);
    if (!permit) return errorResponse('Invalid or expired upload permit.', 403);
    const { crop, target, targetName } = permit;
    const { file } = options;
    if (file.size !== permit.bytes || file.type !== permit.mimeType || await imageSha256(await file.arrayBuffer()) !== permit.sha256) {
      return errorResponse('Image does not match the upload permit.', 403);
    }

    if (!supportsImageMimeType(file.type)) {
      return errorResponse('Only JPEG, PNG, and WebP images are supported.', 415);
    }

    if (file.size > (target.maxInputBytes ?? 5 * 1024 * 1024)) {
      return errorResponse('The source image is too large.', 413);
    }

    try {
      const result = await transformAndStoreImage({
        crop,
        file,
        supabase: context.supabase,
        target,
        userId: context.userClaims!.id,
      });

      return Response.json({
        bucket: result.bucket,
        bytes: result.bytes,
        content_type: result.contentType,
        height: result.height,
        path: result.path,
        public_url: result.publicUrl,
        signed_url: result.signedUrl,
        signed_url_expires_in: result.signedUrlExpiresIn,
        target: targetName,
        width: result.width,
      });
    } catch (error) {
      if (error instanceof ImageTransformError) {
        if (error.code === 'invalid_crop' || error.code === 'input_too_small') return errorResponse(error.message, 422);
        if (error.code === 'input_too_large') return errorResponse(error.message, 413);
        if (error.code === 'unsupported_input') return errorResponse(error.message, 415);
        if (error.code === 'decode_failed' || error.code === 'pixel_limit_exceeded') {
          return errorResponse(error.message, 422);
        }

        console.error('Image storage failed.', {
          cause: error.cause instanceof Error ? error.cause.message : String(error.cause),
          target: targetName,
          userId: context.userClaims!.id,
        });
        return errorResponse(error.message, 500);
      }

      console.error('Unexpected image processing failure.', {
        message: error instanceof Error ? error.message : String(error),
        target: targetName,
        userId: context.userClaims!.id,
      });
      return errorResponse('The image could not be processed.', 500);
    }
  }),
);
