/// <reference lib="deno.ns" />

import { withSupabase } from 'npm:@supabase/server@1.4.1';

import { imageUploadTargets } from '../_shared/image-targets.ts';
import { ImageTransformError, supportsImageMimeType, transformAndStoreImage } from '../_shared/image-transform.ts';

import { parseImageUploadRequest } from './request.ts';

import 'jsr:@supabase/functions-js/edge-runtime.d.ts';

function errorResponse(error: string, status: number) {
  return Response.json({ error }, { status });
}

Deno.serve(
  withSupabase({ auth: 'user' }, async (request, context) => {
    if (request.method !== 'POST') {
      return errorResponse('Method not allowed.', 405);
    }

    let formData: FormData;
    try {
      formData = await request.formData();
    } catch {
      return errorResponse('Expected a multipart form-data request.', 400);
    }

    const options = parseImageUploadRequest(formData);
    if (!options || !Object.hasOwn(imageUploadTargets, options.target)) {
      return errorResponse('Expected one image file, a supported target, and optional valid destination and crop fields.', 400);
    }

    const { crop, destination, file, target: targetName } = options;

    if (!supportsImageMimeType(file.type)) {
      return errorResponse('Only JPEG, PNG, and WebP images are supported.', 415);
    }

    const target = imageUploadTargets[targetName];
    if (file.size > (target.maxInputBytes ?? 5 * 1024 * 1024)) {
      return errorResponse('The source image is too large.', 413);
    }

    try {
      const result = await transformAndStoreImage({
        crop,
        destination,
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
        if (error.code === 'invalid_crop') return errorResponse(error.message, 422);
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
