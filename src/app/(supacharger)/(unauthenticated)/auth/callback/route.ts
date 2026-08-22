// ref: https://github.com/vercel/next.js/blob/canary/examples/with-supabase/app/auth/callback/route.ts

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';
import {
  resolveAuthCallbackFailure,
  resolveAuthCallbackSuccess,
} from '@/supacharger.adapters/auth-callback';
import { getSafeNextPath } from '@/supacharger/auth/safe-next-path';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const nextPath = getSafeNextPath(requestUrl.searchParams.get('next'));
  const supabase = await createClient();
  const context = { code, nextPath, requestUrl, supabase };

  if (!code) {
    return NextResponse.redirect(
      await resolveAuthCallbackFailure({ ...context, reason: 'missing-code' }),
    );
  }

  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
  if (exchangeError) {
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

  return NextResponse.redirect(await resolveAuthCallbackSuccess(context));
}
