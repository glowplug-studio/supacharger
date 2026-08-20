export const AUTH_CONFIRMATION_NOTICE_PARAM = 'confirmation_notice';

export type AuthConfirmationOutcome = 'verified' | 'already-authenticated' | 'invalid';

interface ResolveAuthConfirmationRedirectOptions {
  requestUrl: string;
  requestedNext: string | null;
  fallbackNext: string;
  loginPath: string;
  outcome: AuthConfirmationOutcome;
}

function isSafeInternalPath(path: string | null): path is string {
  return Boolean(path?.startsWith('/') && !path.startsWith('//'));
}

export function resolveAuthConfirmationRedirect({
  requestUrl,
  requestedNext,
  fallbackNext,
  loginPath,
  outcome,
}: ResolveAuthConfirmationRedirectOptions) {
  const destination = outcome === 'invalid'
    ? loginPath
    : isSafeInternalPath(requestedNext)
      ? requestedNext
      : fallbackNext;
  const redirectTo = new URL(destination, requestUrl);

  redirectTo.searchParams.delete('token_hash');
  redirectTo.searchParams.delete('type');
  redirectTo.searchParams.delete('next');

  if (outcome === 'already-authenticated') {
    redirectTo.searchParams.delete('account_confirmed');
    redirectTo.searchParams.set(AUTH_CONFIRMATION_NOTICE_PARAM, 'already-signed-in');
  } else if (outcome === 'invalid') {
    redirectTo.searchParams.set(AUTH_CONFIRMATION_NOTICE_PARAM, 'sign-in');
  }

  return redirectTo;
}
