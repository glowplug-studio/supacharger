// ref: https://github.com/vercel/next.js/blob/canary/examples/with-supabase/app/auth/callback/route.ts

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';
import {
  resolveAuthCallbackFailure,
  resolveAuthCallbackSuccess,
} from '@/supacharger.adapters/auth-callback';
import { EMAIL_CHANGE_PENDING_MESSAGE, emailChangeResultPath } from '@/supacharger/auth/email-change';
import { getSafeNextPath } from '@/supacharger/auth/safe-next-path';
import { initialiseAccountUsername } from '@/supacharger/profile/initialise-account-username';
import { initialiseSocialProfile } from '@/supacharger/profile/initialise-social-profile';
import { appURL } from '@/supacharger/utils/app-origin';
import { getAppRequestOrigin } from '@/supacharger/utils/request-url';

export async function GET(request: NextRequest) {
  const origin = getAppRequestOrigin(request);
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const flow = requestUrl.searchParams.get('flow');
  const nextPath = getSafeNextPath(requestUrl.searchParams.get('next'));
  const supabase = await createClient();
  const context = { code, nextPath, requestUrl, supabase };

  if (flow === 'email-change' && requestUrl.searchParams.get('message') === EMAIL_CHANGE_PENDING_MESSAGE) {
    return NextResponse.redirect(appURL(emailChangeResultPath('pending'), origin));
  }

  if (!code) {
    if (flow === 'email-change') {
      return NextResponse.redirect(appURL(emailChangeResultPath('invalid'), origin));
    }
    return NextResponse.redirect(
      await resolveAuthCallbackFailure({ ...context, reason: 'missing-code' }),
    );
  }

  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
  if (exchangeError) {
    if (flow === 'email-change') {
      return NextResponse.redirect(appURL(emailChangeResultPath('invalid'), origin));
    }
    return NextResponse.redirect(
      await resolveAuthCallbackFailure({ ...context, error: exchangeError, reason: 'exchange-error' }),
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.id) {
    return NextResponse.redirect(
      await resolveAuthCallbackFailure({ ...context, reason: 'missing-user' }),
    );
  }

  if (flow === 'email-change') {
    return NextResponse.redirect(appURL(emailChangeResultPath('complete'), origin));
  }

  if (flow === 'recovery') {
    return NextResponse.redirect(appURL('/account/reset-password/new', origin));
  }

  if (!user.is_anonymous && user.identities?.some((identity) => !['email', 'phone'].includes(identity.provider))) {
    await initialiseSocialProfile(supabase, user.id);
  }

  if (!user.is_anonymous) await initialiseAccountUsername(supabase);

  return NextResponse.redirect(await resolveAuthCallbackSuccess(context));
}
