import { NextRequest, NextResponse } from 'next/server';

import { updateSession } from './lib/supabase/middleware';
import { isLoggedIn } from './lib/supabase/supacharger/supabase-auth';
import { SC_CONFIG } from './supacharger/supacharger-config';

// Utility to match wildcards
function pathMatches(path: string, patterns: string[]) {
  return patterns.some((pattern) => {
    // Convert /account/:path* to regex
    if (pattern.includes(':')) {
      // Replace :param* with .*
      const regex = new RegExp('^' + pattern.replace(/:[^/]+(\*)?/g, '.*').replace(/\//g, '\\/') + '$');
      return regex.test(path);
    }
    return path === pattern;
  });
}

export async function middleware(request: NextRequest) {
  // 1. Update session (get user info)
  const response = await updateSession(request);

  /**
   * ==========
   * Route Auth Guard
   * ==========
   */

  const { pathname } = request.nextUrl;

  const isAuthenticated = await isLoggedIn();

  if (!isAuthenticated) {
    if (SC_CONFIG.AUTH_ONLY_APP) {
      if (!pathMatches(pathname, SC_CONFIG.PATH_AUTH_GARD.UNAUTHED_USER.ALLOWED)) {
        const redirectUrl = request.nextUrl.clone();
        redirectUrl.pathname = SC_CONFIG.USER_REDIRECTS.UNAUTHED_USER.AUTHGUARD_REDIRECT_DESTINATION;
        return NextResponse.redirect(redirectUrl);
      }
    } else {
      if (pathMatches(pathname, SC_CONFIG.PATH_AUTH_GARD.UNAUTHED_USER.DISALLOWED)) {
        const redirectUrl = request.nextUrl.clone();
        redirectUrl.pathname = SC_CONFIG.USER_REDIRECTS.UNAUTHED_USER.AUTHGUARD_REDIRECT_DESTINATION;
        return NextResponse.redirect(redirectUrl);
      }
    }
  } else {
    // authed users
    if (pathMatches(pathname, SC_CONFIG.PATH_AUTH_GARD.AUTHED_USER.DISALLOWED)) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = SC_CONFIG.USER_REDIRECTS.AUTHED_USER.AUTHGUARD_REDIRECT_DESTINATION;
      return NextResponse.redirect(redirectUrl);
    }
  }

  // Otherwise, continue as normal
  return response;
}

// Example matcher to exclude static files and images
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
