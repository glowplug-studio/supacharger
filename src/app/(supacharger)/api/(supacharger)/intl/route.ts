import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { getLocale } from 'next-intl/server';
import { z } from 'zod';

import { isSupportedLocale, LOCALE_COOKIE_NAME, SUPPORTED_LOCALES } from '@/i18n/config';
import { createClient } from '@/lib/supabase/server';
import { schemaName } from '@/supacharger/namespace';

const localeCookieOptions = {
  httpOnly: true,
  maxAge: 60 * 60 * 24 * 365,
  path: '/',
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
};
const LOCALE_PROFILE_SYNC_COOKIE_NAME = `${LOCALE_COOKIE_NAME}_profile_sync`;
const localeRequestSchema = z.object({ locale: z.string().refine(isSupportedLocale) }).strict();

export async function GET() {
  return NextResponse.json({ locale: await getLocale() });
}

export async function POST(request: NextRequest) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Request body must be valid JSON.' }, { status: 400 });
  }

  const parsed = localeRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Unsupported locale.', supportedLocales: SUPPORTED_LOCALES }, { status: 400 });
  }
  const { locale } = parsed.data;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let languageSyncSucceeded = false;
  if (user) {
    const { error } = await supabase.schema(schemaName('api')).rpc('update_account_language_by_current_user', {
      input_language_code: locale,
    });
    languageSyncSucceeded = !error;
  }

  const response = NextResponse.json({ locale });
  response.cookies.set(LOCALE_COOKIE_NAME, locale, localeCookieOptions);
  if (user && languageSyncSucceeded) {
    response.cookies.delete(LOCALE_PROFILE_SYNC_COOKIE_NAME);
  } else {
    response.cookies.set(LOCALE_PROFILE_SYNC_COOKIE_NAME, '1', localeCookieOptions);
  }
  return response;
}
