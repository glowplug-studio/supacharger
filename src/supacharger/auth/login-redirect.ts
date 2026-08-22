import { getURL } from '@/supacharger/utils/helpers';

export const AUTH_LOGIN_NOTICE_PARAM = 'auth_notice';
export const AUTH_LOGIN_NOTICE_VALUE = 'logged-in';

export function getAuthLoginRedirect(destination: string): URL {
  const redirectUrl = new URL(getURL(destination));
  redirectUrl.searchParams.set(AUTH_LOGIN_NOTICE_PARAM, AUTH_LOGIN_NOTICE_VALUE);
  return redirectUrl;
}
