import { isAuthRetryableFetchError } from '@supabase/supabase-js';

/** Availability failures must never be treated as proof that a session is invalid. */
export function isTransientServiceError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  if (isAuthRetryableFetchError(error)) return true;
  const candidate = error as { status?: number; code?: string; name?: string; message?: string; cause?: unknown };
  if (candidate.status === 408 || candidate.status === 429 || (candidate.status ?? 0) >= 500) return true;
  if (['PGRST000', 'PGRST001', 'PGRST002', 'PGRST003', '08000', '08001', '08006', '53300', '57P01', '57P02', '57P03', 'ECONNRESET', 'ECONNREFUSED', 'ETIMEDOUT', 'EAI_AGAIN'].includes(candidate.code ?? '')) return true;
  if (candidate.name === 'AbortError' || candidate.name === 'TimeoutError') return true;
  if (candidate.name === 'TypeError' && /fetch failed|failed to fetch|networkerror|network request failed/i.test(candidate.message ?? '')) return true;
  return candidate.cause !== error && Boolean(candidate.cause && isTransientServiceError(candidate.cause));
}
