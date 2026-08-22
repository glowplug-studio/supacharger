// Ref: https://supabase.com/docs/guides/auth/server-side/nextjs
import { type NextRequest, NextResponse } from 'next/server';

import type { Database } from '@/lib/supabase/types';
import { SC_CONFIG } from '@/supacharger/supacharger-config';
import { getEnvVar } from '@/supacharger/utils/helpers';
import { createServerClient } from '@supabase/ssr';

export type VerifiedAuthClaims = {
  is_anonymous?: boolean;
  role?: string;
  sub?: string;
  [claim: string]: unknown;
};

/**
 * Refresh the Supabase session and verify the signed access-token claims once.
 *
 * Keep database and product access checks out of Proxy. Protected layouts,
 * Server Actions, and Route Handlers must enforce their own authoritative
 * access rules with the request-scoped server client.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    getEnvVar(process.env.NEXT_PUBLIC_SUPABASE_URL, 'NEXT_PUBLIC_SUPABASE_URL'),
    getEnvVar(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, 'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY'),
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
          Object.entries(headers).forEach(([name, value]) => response.headers.set(name, value));
        },
      },
    },
  );

  const { data, error: verificationError } = await supabase.auth.getClaims();
  const claims = (data?.claims ?? null) as VerifiedAuthClaims | null;
  const isAnonymous = claims?.is_anonymous === true;
  const hasAuthenticatedIdentity = Boolean(claims?.sub && claims.role === 'authenticated');
  const isAuthenticated =
    !verificationError &&
    hasAuthenticatedIdentity &&
    (SC_CONFIG.AUTH_SESSION.ALLOW_ANONYMOUS_USERS || !isAnonymous);

  return {
    claims,
    isAuthenticated,
    response,
    verificationError,
  };
}
