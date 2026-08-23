import { z } from 'zod';

import { isSupportedLocale } from '@/i18n/config';
import type { UsernamePolicy } from '@/supacharger/profile/profile-identity';

const nameSchema = z.string().trim().min(1).max(100);
const usernameSchema = z.string().trim().max(40).refine((value) => value === '' || /^[A-Za-z0-9_-]{3,40}$/.test(value));

export function createAccountDetailsSchema(usernamePolicy: UsernamePolicy) {
  return z
    .object({
      firstName: nameSchema,
      lastName: nameSchema,
      username: usernameSchema,
      language: z.string().refine(isSupportedLocale),
      extension: z.unknown(),
    })
    .strict()
    .superRefine((value, context) => {
      if (usernamePolicy === 'required' && !value.username) {
        context.addIssue({ code: 'custom', path: ['username'] });
      }
    });
}
