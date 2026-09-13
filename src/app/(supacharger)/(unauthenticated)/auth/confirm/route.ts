import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { createClient } from '@/lib/supabase/server';
import { resolveAuthConfirmationRedirect } from '@/supacharger/auth/confirmation-redirect';
import { SC_CONFIG } from '@/supacharger/supacharger-config';
import { getAppRequestOrigin } from '@/supacharger/utils/request-url';

const confirmationSchema = z.object({
  token_hash: z.string().min(1).max(2048),
  type: z.enum(['email', 'signup', 'invite', 'magiclink', 'recovery', 'email_change']),
});

function redirectWithoutCaching(path: string | URL, requestUrl: string) {
  const response = NextResponse.redirect(new URL(path, requestUrl));
  response.headers.set('Cache-Control', 'private, no-store');
  response.headers.set('Referrer-Policy', 'no-referrer');
  return response;
}

// Creating a handler to a GET request to route /auth/confirm
export async function GET(request: NextRequest) {
  getAppRequestOrigin(request);
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get('token_hash');
  const type = searchParams.get('type');
  const requestedNext = searchParams.get('next');
  const supabase = await createClient();

  const parsed = confirmationSchema.safeParse({ token_hash, type });
  if (parsed.success) {
    const { error } = await supabase.auth.verifyOtp(parsed.data);
    if (!error) {
      if (type === 'recovery') {
        // Supabase's token-hash verification establishes the session. Its AMR
        // is `otp`, not a recovery-specific permission or session type.
        return redirectWithoutCaching('/account/reset-password/new', request.url);
      }
      return redirectWithoutCaching(resolveAuthConfirmationRedirect({
        requestUrl: request.url,
        requestedNext,
        fallbackNext: SC_CONFIG.ACCOUNT_CONFIRMED_PATH,
        loginPath: SC_CONFIG.USER_REDIRECTS.UNAUTHED_USER.AUTHGUARD_REDIRECT_DESTINATION,
        outcome: 'verified',
      }), request.url);
    }
  }

  // A signed-in browser must never turn a failed recovery token into success.
  if (type === 'recovery') {
    return redirectWithoutCaching('/auth/error?flow=recovery', request.url);
  }

  // A signup OTP and its email link represent the same one-time verification.
  // If the OTP was used first, the link is expected to fail even though the
  // current browser may already hold the newly confirmed session.
  const { data: { user } } = await supabase.auth.getUser();

  return redirectWithoutCaching(resolveAuthConfirmationRedirect({
    requestUrl: request.url,
    requestedNext,
    fallbackNext: SC_CONFIG.ACCOUNT_CONFIRMED_PATH,
    loginPath: SC_CONFIG.USER_REDIRECTS.UNAUTHED_USER.AUTHGUARD_REDIRECT_DESTINATION,
    outcome: user?.email_confirmed_at ? 'already-authenticated' : 'invalid',
  }), request.url);
}
