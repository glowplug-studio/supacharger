import { z } from 'npm:zod@4.4.3';

import { defineImageUploadTargets, resolveImageDestination } from '../_shared/image-target-contract.ts';

const identifier = z.string().regex(/^[a-z0-9][a-z0-9_-]*$/).max(100);
const dimension = z.number().int().min(1).max(4096);
const targetSchema = z.strictObject({
  bucket: identifier, filenamePrefix: identifier,
  pathPrefix: z.string().max(256).refine(value => { try { resolveImageDestination(value, ''); return true; } catch { return false; } }),
  fit: z.enum(['inside', 'cover']), outputFormat: z.enum(['jpeg', 'png']), visibility: z.enum(['private', 'public']),
  maxWidth: dimension.optional(), maxHeight: dimension.optional(), minInputWidth: dimension.optional(), minInputHeight: dimension.optional(),
  maxInputBytes: z.number().int().min(1).max(10 * 1024 * 1024).optional(),
  maxInputPixels: z.number().int().min(1).max(40_000_000).nullable().optional(),
  qualityPercent: z.number().int().min(1).max(100).optional(),
  pngCompressionPercent: z.number().int().min(0).max(100).optional(),
  signedUrlSeconds: z.number().int().min(1).max(86400).optional(),
  cacheControl: z.string().regex(/^\d{1,10}$/).optional(),
});

const permitSchema = z.strictObject({
  version: z.literal(1), userId: z.string().uuid(), expiresAt: z.number().int().positive(),
  targetName: identifier, target: targetSchema,
  crop: z.strictObject({ x: z.number().int().nonnegative(), y: z.number().int().nonnegative(), width: z.number().int().positive(), height: z.number().int().positive() }).optional(),
  sha256: z.string().regex(/^[a-f0-9]{64}$/), bytes: z.number().int().positive().max(10 * 1024 * 1024),
  mimeType: z.enum(['image/jpeg', 'image/png', 'image/webp']),
});

export function parseImagePermit(text: string, userId: string, now = Date.now()) {
  try {
    const result = permitSchema.safeParse(JSON.parse(text));
    if (!result.success || result.data.userId !== userId || result.data.expiresAt <= now || result.data.expiresAt > now + 300_000) return null;
    defineImageUploadTargets({ [result.data.targetName]: result.data.target });
    return result.data;
  } catch { return null; }
}

export function parseImageUploadRequest(formData: FormData) {
  const allowed = new Set(['file', 'permit', 'signature']);
  for (const field of new Set(formData.keys())) {
    if (!allowed.has(field) || formData.getAll(field).length !== 1) return null;
  }
  const result = z.strictObject({ file: z.instanceof(File), permit: z.string().min(1).max(8192), signature: z.string().regex(/^[a-f0-9]{64}$/) }).safeParse(Object.fromEntries(formData));
  return result.success ? result.data : null;
}
