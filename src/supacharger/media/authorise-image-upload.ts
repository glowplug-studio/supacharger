import { z } from 'zod';

import { imageUploadTargets } from '@/supacharger.adapters/media/image-targets';

import { resolveImageDestination } from '../../../supabase/functions/_shared/image-target-contract';
import { signImagePermit } from '../../../supabase/functions/process-image-upload-v2/permit-crypto';

import 'server-only';

const requestSchema = z.strictObject({
  target: z.string().regex(/^[a-z0-9][a-z0-9_-]*$/).max(100),
  destination: z.string().max(256).optional(),
  crop: z.strictObject({
    x: z.number().int().nonnegative(), y: z.number().int().nonnegative(),
    width: z.number().int().positive(), height: z.number().int().positive(),
  }).optional(),
  sha256: z.string().regex(/^[a-f0-9]{64}$/),
  bytes: z.number().int().positive().max(10 * 1024 * 1024),
  mimeType: z.enum(['image/jpeg', 'image/png', 'image/webp']),
});

/** Call only with a server-verified user ID; never accept identity or policy from the browser. */
export async function authoriseImageUpload(input: unknown, userId: string) {
  const parsed = requestSchema.safeParse(input);
  if (!parsed.success) throw new Error('Invalid image upload request.');
  const request = parsed.data;
  if (!Object.hasOwn(imageUploadTargets, request.target)) throw new Error('Unsupported image target.');
  const target = imageUploadTargets[request.target];
  if (request.bytes > (target.maxInputBytes ?? 5 * 1024 * 1024)) throw new Error('The source image is too large.');
  const pathPrefix = resolveImageDestination(request.destination, target.pathPrefix);
  const permit = JSON.stringify({
    version: 1, userId, expiresAt: Date.now() + 300_000,
    targetName: request.target, target: { ...target, pathPrefix },
    crop: request.crop, sha256: request.sha256, bytes: request.bytes, mimeType: request.mimeType,
  });
  const signature = await signImagePermit(permit, process.env.IMAGE_UPLOAD_SIGNING_SECRET ?? '');
  return { permit, signature };
}
