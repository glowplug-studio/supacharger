import { redirect } from 'next/navigation';

import { getSafeNextPath } from './safe-next-path';
import { isTransientServiceError } from './transient-error';

export function redirectIfServiceUnavailable(error: unknown, next = '/') {
  if (isTransientServiceError(error)) {
    redirect(`/auth/unavailable?next=${encodeURIComponent(getSafeNextPath(next) ?? '/')}`);
  }
}
