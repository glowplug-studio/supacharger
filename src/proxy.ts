import { NextRequest, NextResponse } from 'next/server';

import { isSupportedLocale, LOCALE_COOKIE_NAME } from './i18n/config';
import { updateSession } from './lib/supabase/middleware';
import { copySupabaseResponseState } from './supacharger/auth/proxy-response';
import { pathMatches } from './supacharger/auth/route-policy';
import { SC_CONFIG } from './supacharger/supacharger-config';

const localeCookieOptions = {
  httpOnly: true,
  maxAge: 60 * 60 * 24 * 365,
  path: '/',
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
};
const LOCALE_PROFILE_SYNC_COOKIE_NAME = `${LOCALE_COOKIE_NAME}_profile_sync`;

export async function proxy(request: NextRequest) {
  const hasLanguageHandoff = request.nextUrl.searchParams.has('lang');
  const handoffLocale = request.nextUrl.searchParams.get('lang');
  const acceptedHandoffLocale = isSupportedLocale(handoffLocale) ? handoffLocale : null;

  if (acceptedHandoffLocale) {
    request.cookies.set(LOCALE_COOKIE_NAME, acceptedHandoffLocale);
    request.cookies.set(LOCALE_PROFILE_SYNC_COOKIE_NAME, '1');
  }

  // Update the Supabase session before performing route or profile checks.
  const { isAuthenticated, response: sessionResponse, supabase } = await updateSession(request);
  let response = sessionResponse;
  const cookieLocale = request.cookies.get(LOCALE_COOKIE_NAME)?.value;
  const shouldSyncProfile =
    request.cookies.get(LOCALE_PROFILE_SYNC_COOKIE_NAME)?.value === '1' && isSupportedLocale(cookieLocale);
  let languageSyncSucceeded = false;

  if (isAuthenticated && shouldSyncProfile) {
    const { error } = await supabase.schema('api').rpc('update_account_language_by_current_user', {
      p_language_code: cookieLocale,
    });

    languageSyncSucceeded = !error;
    if (languageSyncSucceeded) {
      response.cookies.delete(LOCALE_PROFILE_SYNC_COOKIE_NAME);
    }
  } else if (isAuthenticated && !isSupportedLocale(cookieLocale)) {
    const { data: profiles } = await supabase.schema('api').rpc('get_account_profile_by_current_user');
    const profile = profiles?.[0];

    if (isSupportedLocale(profile?.language_code)) {
      request.cookies.set(LOCALE_COOKIE_NAME, profile.language_code);
      const localeResponse = NextResponse.next({ request });
      copySupabaseResponseState(response, localeResponse);
      localeResponse.cookies.set(LOCALE_COOKIE_NAME, profile.language_code, localeCookieOptions);
      response = localeResponse;
    }
  }

  if (acceptedHandoffLocale) {
    response.cookies.set(LOCALE_COOKIE_NAME, acceptedHandoffLocale, localeCookieOptions);
    if (!isAuthenticated || !languageSyncSucceeded) {
      response.cookies.set(LOCALE_PROFILE_SYNC_COOKIE_NAME, '1', localeCookieOptions);
    }
  }

  if (hasLanguageHandoff) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.searchParams.delete('lang');
    return copySupabaseResponseState(response, NextResponse.redirect(redirectUrl));
  }

  /**
   * ==========
   * Route Auth Guard
   * ==========
   */

  const { pathname } = request.nextUrl;

  if (
    isAuthenticated &&
    SC_CONFIG.POST_SIGN_IN_ONBOARDING.REQUIRED &&
    pathname !== SC_CONFIG.POST_SIGN_IN_ONBOARDING.REDIRECT_PATH &&
    !pathname.startsWith('/api/') &&
    !pathname.startsWith('/auth/')
  ) {
    const { data: profileComplete, error: profileError } = await supabase
      .schema('api')
      .rpc('is_profile_complete_by_current_user', {
        p_username_required: SC_CONFIG.PROFILE_IDENTITY.USERNAME === 'required',
      });

    if (!profileError && profileComplete === false) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = SC_CONFIG.POST_SIGN_IN_ONBOARDING.REDIRECT_PATH;
      redirectUrl.search = '';
      return copySupabaseResponseState(response, NextResponse.redirect(redirectUrl));
    }
  }

  if (!isAuthenticated) {
    if (SC_CONFIG.AUTH_ONLY_APP) {
      if (!pathMatches(pathname, SC_CONFIG.PATH_AUTH_GUARD.UNAUTHED_USER.ALLOWED)) {
        if (pathname.startsWith('/api/')) {
          return copySupabaseResponseState(
            response,
            NextResponse.json({ error: 'Authentication required' }, { status: 401 }),
          );
        }
        const redirectUrl = request.nextUrl.clone();
        redirectUrl.pathname = SC_CONFIG.USER_REDIRECTS.UNAUTHED_USER.AUTHGUARD_REDIRECT_DESTINATION;
        return copySupabaseResponseState(response, NextResponse.redirect(redirectUrl));
      }
    } else {
      if (pathMatches(pathname, SC_CONFIG.PATH_AUTH_GUARD.UNAUTHED_USER.DISALLOWED)) {
        if (pathname.startsWith('/api/')) {
          return copySupabaseResponseState(
            response,
            NextResponse.json({ error: 'Authentication required' }, { status: 401 }),
          );
        }
        const redirectUrl = request.nextUrl.clone();
        redirectUrl.pathname = SC_CONFIG.USER_REDIRECTS.UNAUTHED_USER.AUTHGUARD_REDIRECT_DESTINATION;
        return copySupabaseResponseState(response, NextResponse.redirect(redirectUrl));
      }
    }
  } else {
    // authed users
    if (pathMatches(pathname, SC_CONFIG.PATH_AUTH_GUARD.AUTHED_USER.DISALLOWED)) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = SC_CONFIG.USER_REDIRECTS.AUTHED_USER.AUTHGUARD_REDIRECT_DESTINATION;
      return copySupabaseResponseState(response, NextResponse.redirect(redirectUrl));
    }
  }

  // Otherwise, continue as normal
  return response;
}

// Example matcher to exclude static files and images
export const config = {
  matcher: ['/((?!\\.well-known(?:/.*)?|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
