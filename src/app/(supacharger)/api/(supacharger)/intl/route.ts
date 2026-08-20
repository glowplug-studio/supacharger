import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { getLocale } from 'next-intl/server';

import {
  isSupportedLocale,
  LOCALE_COOKIE_NAME,
  SUPPORTED_LOCALES,
} from '@/i18n/config';
import { createClient } from '@/lib/supabase/server';

const localeCookieOptions = {
  httpOnly: true,
  maxAge: 60 * 60 * 24 * 365,
  path: '/',
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
};
const LOCALE_PROFILE_SYNC_COOKIE_NAME = `${LOCALE_COOKIE_NAME}_profile_sync`;

export async function GET() {
  return NextResponse.json({ locale: await getLocale() });
}

export async function POST(request: NextRequest) {
  let locale: unknown;

  try {
    locale = (await request.json())?.locale;
  } catch {
    return NextResponse.json({ error: 'Request body must be valid JSON.' }, { status: 400 });
  }

  if (!isSupportedLocale(locale)) {
    return NextResponse.json({ error: 'Unsupported locale.', supportedLocales: SUPPORTED_LOCALES }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { error } = await supabase.schema('api').rpc('update_account_language_by_current_user', {
      p_language_code: locale,
    });

    if (error) {
      return NextResponse.json({ error: 'Unable to save locale preference.' }, { status: 500 });
    }
  }

  const response = NextResponse.json({ locale });
  response.cookies.set(LOCALE_COOKIE_NAME, locale, localeCookieOptions);
  if (user) {
    response.cookies.delete(LOCALE_PROFILE_SYNC_COOKIE_NAME);
  } else {
    response.cookies.set(LOCALE_PROFILE_SYNC_COOKIE_NAME, '1', localeCookieOptions);
  }
  return response;
}
