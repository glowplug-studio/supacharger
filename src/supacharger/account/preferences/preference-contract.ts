import { z } from 'zod';

export const preferenceOptionSchema = z.object({
  description: z.string().min(1).max(500),
  disabled: z.boolean().optional(),
  id: z.string().regex(/^[a-zA-Z0-9_-]{1,100}$/),
  label: z.string().min(1).max(160),
  value: z.boolean(),
}).strict();

export const preferenceSurfaceSchema = z.object({
  availability: z.enum(['enabled', 'disabled']),
  description: z.string().min(1).max(1000),
  disabledMessage: z.string().min(1).max(500).optional(),
  options: z.array(preferenceOptionSchema).max(100),
  title: z.string().min(1).max(160),
}).strict();

export const preferenceMutationSchema = z.object({
  values: z.record(z.string().regex(/^[a-zA-Z0-9_-]{1,100}$/), z.boolean()),
}).strict();

export type PreferenceKind = 'notifications' | 'privacy';
export type PreferenceSurface = z.infer<typeof preferenceSurfaceSchema>;
export type PreferenceValues = z.infer<typeof preferenceMutationSchema>['values'];
