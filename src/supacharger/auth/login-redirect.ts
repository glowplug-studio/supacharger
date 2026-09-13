import { appURL } from '@/supacharger/utils/app-origin';

export const AUTH_LOGIN_NOTICE_PARAM = 'auth_notice';
export const AUTH_LOGIN_NOTICE_VALUE = 'logged-in';

export function getAuthLoginRedirect(destination: string, origin: string): URL {
  const redirectUrl = new URL(appURL(destination, origin));
  redirectUrl.searchParams.set(AUTH_LOGIN_NOTICE_PARAM, AUTH_LOGIN_NOTICE_VALUE);
  return redirectUrl;
}
