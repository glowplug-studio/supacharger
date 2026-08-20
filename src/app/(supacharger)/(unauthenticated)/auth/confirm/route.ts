import { type NextRequest, NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';
import { resolveAuthConfirmationRedirect } from '@/supacharger/auth/confirmation-redirect';
import { SC_CONFIG } from '@/supacharger/supacharger-config';
import { type EmailOtpType } from '@supabase/supabase-js';

// Creating a handler to a GET request to route /auth/confirm
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get('token_hash');
  const type = searchParams.get('type') as EmailOtpType | null;
  const requestedNext = searchParams.get('next');
  const supabase = await createClient();

  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    });
    if (!error) {
      return NextResponse.redirect(resolveAuthConfirmationRedirect({
        requestUrl: request.url,
        requestedNext,
        fallbackNext: SC_CONFIG.ACCOUNT_CONFIRMED_PATH,
        loginPath: SC_CONFIG.USER_REDIRECTS.UNAUTHED_USER.AUTHGUARD_REDIRECT_DESTINATION,
        outcome: 'verified',
      }));
    }
  }

  // A signup OTP and its email link represent the same one-time verification.
  // If the OTP was used first, the link is expected to fail even though the
  // current browser may already hold the newly confirmed session.
  const { data: { user } } = await supabase.auth.getUser();

  return NextResponse.redirect(resolveAuthConfirmationRedirect({
    requestUrl: request.url,
    requestedNext,
    fallbackNext: SC_CONFIG.ACCOUNT_CONFIRMED_PATH,
    loginPath: SC_CONFIG.USER_REDIRECTS.UNAUTHED_USER.AUTHGUARD_REDIRECT_DESTINATION,
    outcome: user?.email_confirmed_at ? 'already-authenticated' : 'invalid',
  }));
}
