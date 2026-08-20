// Ref: https://supabase.com/docs/guides/auth/server-side/nextjs
import { type NextRequest, NextResponse } from 'next/server';

import type { Database } from '@/lib/supabase/types';
import { SC_CONFIG } from '@/supacharger/supacharger-config';
import { getEnvVar } from '@/supacharger/utils/helpers';
import { createServerClient } from '@supabase/ssr';
import type { User } from '@supabase/supabase-js';

export type VerifiedAuthClaims = {
  is_anonymous?: boolean;
  role?: string;
  sub?: string;
  [claim: string]: unknown;
};

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

  let claims: VerifiedAuthClaims | null = null;
  let user: User | null = null;
  let verificationError: unknown = null;
  const verificationMode = SC_CONFIG.AUTH_SESSION.VERIFICATION_MODE as 'claims' | 'user';

  if (verificationMode === 'user') {
    const result = await supabase.auth.getUser();
    user = result.data.user;
    verificationError = result.error;
  } else {
    const result = await supabase.auth.getClaims();
    claims = result.data?.claims ?? null;
    verificationError = result.error;
  }

  const isAnonymous = claims?.is_anonymous === true || user?.is_anonymous === true;
  const hasAuthenticatedIdentity = claims
    ? Boolean(claims.sub && claims.role === 'authenticated')
    : Boolean(user?.id && user.aud === 'authenticated');
  const isAuthenticated =
    !verificationError &&
    hasAuthenticatedIdentity &&
    (SC_CONFIG.AUTH_SESSION.ALLOW_ANONYMOUS_USERS || !isAnonymous);

  return {
    claims,
    isAuthenticated,
    response,
    supabase,
    user,
    verificationError,
  };
}
