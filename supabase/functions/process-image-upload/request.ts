import { z } from 'npm:zod@4.4.3';

import { resolveImageDestination } from '../_shared/image-target-contract.ts';

const cropSchema = z.strictObject({
  x: z.number().int().nonnegative(),
  y: z.number().int().nonnegative(),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
});

const cropFieldSchema = z.string().max(256).transform((value, context) => {
  try {
    return JSON.parse(value) as unknown;
  } catch {
    context.addIssue({ code: 'custom', message: 'Expected crop JSON.' });
    return z.NEVER;
  }
}).pipe(cropSchema);

const uploadOptionsSchema = z.object({
  crop: cropFieldSchema.optional(),
  destination: z.string().max(256).refine((destination) => {
    try {
      resolveImageDestination(destination, '');
      return true;
    } catch {
      return false;
    }
  }).optional(),
  file: z.instanceof(File),
  target: z.string(),
});

/** Reject duplicate/unknown fields before Zod parses the untrusted multipart values. */
export function parseImageUploadRequest(formData: FormData) {
  const allowedFields = new Set(['crop', 'destination', 'file', 'target']);
  for (const field of new Set(formData.keys())) {
    if (!allowedFields.has(field) || formData.getAll(field).length !== 1) return null;
  }
  const parsed = uploadOptionsSchema.safeParse({
    crop: formData.has('crop') ? formData.get('crop') : undefined,
    destination: formData.has('destination') ? formData.get('destination') : undefined,
    file: formData.get('file'),
    target: formData.get('target'),
  });
  return parsed.success ? parsed.data : null;
}
