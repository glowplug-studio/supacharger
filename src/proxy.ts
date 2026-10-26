import { NextRequest, NextResponse } from 'next/server';

import englishMessages from '../messages/en.json';

import { isSupportedLocale, LOCALE_COOKIE_NAME } from './i18n/config';
import { updateSession } from './lib/supabase/supacharger/proxy';
import { resolveProjectRequest } from './supacharger.adapters/request-guard';
import { EMAIL_CHANGE_PENDING_MESSAGE } from './supacharger/auth/email-change';
import { copySupabaseResponseState } from './supacharger/auth/proxy-response';
import { pathMatches } from './supacharger/auth/route-policy';
import { withNextPath } from './supacharger/auth/safe-next-path';
import { hasSensitiveAuthQuery, removeSensitiveAuthQuery } from './supacharger/auth/sensitive-auth-query';
import { createAuthUnavailableResponse } from './supacharger/auth/unavailable-response';
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
  if (request.nextUrl.pathname === '/organisation') {
    const destination = request.nextUrl.clone();
    destination.pathname = SC_CONFIG.ORGANISATIONS.CHOOSER_PATH;
    removeSensitiveAuthQuery(destination.searchParams);
    return NextResponse.redirect(destination, 301);
  }

  // Logout must reach its own SSR client even when the session is absent,
  // expired or cannot be refreshed. Page guards must never redirect its POST.
  if (request.nextUrl.pathname === '/account/logout') {
    const response = NextResponse.next({ request });
    response.headers.set('Cache-Control', 'private, no-store');
    return response;
  }

  // Older hosted templates fell back to the Site URL. Route their credentials
  // to the verifier before the ordinary page guard can wrap them in `next`.
  if (request.nextUrl.pathname === '/') {
    const params = request.nextUrl.searchParams;
    const isTokenLink = params.has('token_hash') &&
      ['email', 'signup', 'invite', 'magiclink', 'recovery', 'email_change'].includes(params.get('type') ?? '');
    if (isTokenLink || params.get('message') === EMAIL_CHANGE_PENDING_MESSAGE) {
      const target = new URL('/auth/confirm', request.url);
      for (const key of ['token_hash', 'type', 'message', 'lang']) {
        const value = params.get(key);
        if (value) target.searchParams.set(key, value);
      }
      const response = NextResponse.redirect(target);
      response.headers.set('Cache-Control', 'private, no-store');
      response.headers.set('Referrer-Policy', 'no-referrer');
      return response;
    }
  }

  const hasLanguageHandoff = request.nextUrl.searchParams.has('lang');
  const handoffLocale = request.nextUrl.searchParams.get('lang');
  const acceptedHandoffLocale = isSupportedLocale(handoffLocale) ? handoffLocale : null;

  if (acceptedHandoffLocale) {
    request.cookies.set(LOCALE_COOKIE_NAME, acceptedHandoffLocale);
  }

  if (hasSensitiveAuthQuery(request.nextUrl.pathname, request.nextUrl.searchParams)) {
    const redirectUrl = request.nextUrl.clone();
    removeSensitiveAuthQuery(redirectUrl.searchParams);
    redirectUrl.searchParams.delete('lang');
    const response = NextResponse.redirect(redirectUrl);

    if (acceptedHandoffLocale) {
      response.cookies.set(LOCALE_COOKIE_NAME, acceptedHandoffLocale, localeCookieOptions);
    }

    return response;
  }

  const { isAuthenticated, response, temporarilyUnavailable, supabase, getResponse } = await updateSession(request);

  if (temporarilyUnavailable) {
    return createAuthUnavailableResponse(request, response, SC_CONFIG.SITE_TITLE, englishMessages.ServiceUnavailable);
  }

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

  // Product availability checks run only after all authentication redirects.
  // Reuse the verified client and copy its latest cookie state after the guard.
  if (pathname !== '/error') {
    try {
      const guarded = await resolveProjectRequest({ request, isAuthenticated, supabase });
      if (guarded) return copySupabaseResponseState(getResponse(), guarded);
    } catch {
      return copySupabaseResponseState(getResponse(), new NextResponse(null, {
        status: 503,
        headers: { 'Cache-Control': 'private, no-store', 'Retry-After': '30' },
      }));
    }
  }
  return getResponse();
}

// Example matcher to exclude static files and images
export const config = {
  matcher: [
    '/((?!\\.well-known(?:/.*)?|_next(?:/.*)?|favicon.ico|robots\\.txt|sitemap\\.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|webmanifest)$).*)',
  ],
};
