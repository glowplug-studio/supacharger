import { z } from 'zod';

export const OAUTH_CANCELLED_NOTICE = 'login-cancelled';
export const OAUTH_CANCELLED_PATH = `/account/login?auth_notice=${OAUTH_CANCELLED_NOTICE}`;

const cancellationSchema = z.object({
  error: z.literal('access_denied'),
  // A specific service error must not be presented as voluntary cancellation.
  error_code: z.enum(['', 'access_denied']).nullable(),
});

export function isOAuthCancellation(params: URLSearchParams): boolean {
  return cancellationSchema.safeParse({
    error: params.get('error'),
    error_code: params.get('error_code'),
  }).success;
}
