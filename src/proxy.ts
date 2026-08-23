import { NextRequest, NextResponse } from 'next/server';

import { isSupportedLocale, LOCALE_COOKIE_NAME } from './i18n/config';
import { updateSession } from './lib/supabase/supacharger/proxy';
import { copySupabaseResponseState } from './supacharger/auth/proxy-response';
import { pathMatches } from './supacharger/auth/route-policy';
import { withNextPath } from './supacharger/auth/safe-next-path';
import { SC_CONFIG } from './supacharger/supacharger-config';

const localeCookieOptions = {
  httpOnly: true,
  maxAge: 60 * 60 * 24 * 365,
  path: '/',
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
};

function redirectWithSessionState(request: NextRequest, response: NextResponse, pathname: string) {
  const requestedNext = `${request.nextUrl.pathname}${request.nextUrl.search}`;
  const redirectUrl = new URL(withNextPath(pathname, requestedNext), request.url);

  return copySupabaseResponseState(response, NextResponse.redirect(redirectUrl));
}

export async function proxy(request: NextRequest) {
  const hasLanguageHandoff = request.nextUrl.searchParams.has('lang');
  const handoffLocale = request.nextUrl.searchParams.get('lang');
  const acceptedHandoffLocale = isSupportedLocale(handoffLocale) ? handoffLocale : null;

  if (acceptedHandoffLocale) {
    request.cookies.set(LOCALE_COOKIE_NAME, acceptedHandoffLocale);
  }

  const { isAuthenticated, response } = await updateSession(request);

  if (acceptedHandoffLocale) {
    response.cookies.set(LOCALE_COOKIE_NAME, acceptedHandoffLocale, localeCookieOptions);
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
  const isPublicPath = pathMatches(pathname, SC_CONFIG.PATH_AUTH_GUARD.UNAUTHED_USER.ALLOWED);

  if (!isAuthenticated) {
    if (SC_CONFIG.AUTH_ONLY_APP) {
      if (!isPublicPath) {
        if (pathname.startsWith('/api/')) {
          return copySupabaseResponseState(
            response,
            NextResponse.json({ error: 'Authentication required' }, { status: 401 }),
          );
        }
        return redirectWithSessionState(
          request,
          response,
          SC_CONFIG.USER_REDIRECTS.UNAUTHED_USER.AUTHGUARD_REDIRECT_DESTINATION,
        );
      }
    } else {
      if (pathMatches(pathname, SC_CONFIG.PATH_AUTH_GUARD.UNAUTHED_USER.DISALLOWED)) {
        if (pathname.startsWith('/api/')) {
          return copySupabaseResponseState(
            response,
            NextResponse.json({ error: 'Authentication required' }, { status: 401 }),
          );
        }
        return redirectWithSessionState(
          request,
          response,
          SC_CONFIG.USER_REDIRECTS.UNAUTHED_USER.AUTHGUARD_REDIRECT_DESTINATION,
        );
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
  matcher: [
    '/((?!\\.well-known(?:/.*)?|_next(?:/.*)?|favicon.ico|robots\\.txt|sitemap\\.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|webmanifest)$).*)',
  ],
};
