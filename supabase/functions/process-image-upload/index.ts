/// <reference lib="deno.ns" />

import 'jsr:@supabase/functions-js/edge-runtime.d.ts';

import { withSupabase } from 'npm:@supabase/server@1.4.1';

import { imageUploadTargets } from '../_shared/image-targets.ts';
import { ImageTransformError, supportsImageMimeType, transformAndStoreImage } from '../_shared/image-transform.ts';

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

    const allowedFields = new Set(['file', 'target']);

    for (const field of new Set(formData.keys())) {
      if (!allowedFields.has(field)) {
        return errorResponse(`Unexpected multipart form field "${field}".`, 400);
      }
    }

    if (formData.getAll('file').length !== 1 || formData.getAll('target').length !== 1) {
      return errorResponse('Expected exactly one "file" field and one "target" field.', 400);
    }

    const file = formData.get('file');
    const targetName = formData.get('target');

    if (!(file instanceof File)) {
      return errorResponse('Expected multipart form field "file".', 400);
    }

    if (typeof targetName !== 'string' || !Object.hasOwn(imageUploadTargets, targetName)) {
      return errorResponse('Expected multipart form field "target" with a supported image target.', 400);
    }

    if (!supportsImageMimeType(file.type)) {
      return errorResponse('Only JPEG, PNG, and WebP images are supported.', 415);
    }

    const target = imageUploadTargets[targetName];
    if (file.size > (target.maxInputBytes ?? 5 * 1024 * 1024)) {
      return errorResponse('The source image is too large.', 413);
    }

    try {
      const result = await transformAndStoreImage({
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
