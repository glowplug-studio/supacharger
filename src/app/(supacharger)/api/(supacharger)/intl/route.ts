import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { getLocale } from 'next-intl/server';

import {
  isSupportedLocale,
  LOCALE_COOKIE_NAME,
  SUPPORTED_LOCALES,
} from '@/i18n/config';

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
    return NextResponse.json(
      { error: 'Unsupported locale.', supportedLocales: SUPPORTED_LOCALES },
      { status: 400 }
    );
  }

  const response = NextResponse.json({ locale });
  response.cookies.set(LOCALE_COOKIE_NAME, locale, {
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 365,
    path: '/',
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  });
  return response;
}
