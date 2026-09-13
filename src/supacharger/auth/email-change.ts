/** Supabase's first confirmation is informational and does not establish a session. */
export const EMAIL_CHANGE_PENDING_MESSAGE =
  'Confirmation link accepted. Please proceed to confirm link sent to the other email';

export function emailChangeResultPath(status: 'pending' | 'complete' | 'invalid') {
  return `/auth/error?flow=email-change&status=${status}`;
}
