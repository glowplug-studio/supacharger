import { revalidatePath } from 'next/cache';
import type { NextRequest } from 'next/server';
import { connection, NextResponse } from 'next/server';
import { getTranslations } from 'next-intl/server';

import { LOCALE_COOKIE_NAME } from '@/i18n/config';
import { createClient } from '@/lib/supabase/server';
import {
  accountProfileExtensionSchema,
  updateAccountProfileExtension,
} from '@/supacharger.adapters/account/profile-extension';
import { loadAccountSummary } from '@/supacharger/account/account-summary';
import { createAccountDetailsSchema } from '@/supacharger/account/settings/account-details-schema';
import type { AccountDetailsFieldErrors } from '@/supacharger/account/settings/account-settings-contract';
import { SC_CONFIG } from '@/supacharger/supacharger-config';

export const instant = false;

const localeCookieOptions = {
  httpOnly: true,
  maxAge: 60 * 60 * 24 * 365,
  path: '/',
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
};

export async function POST(request: NextRequest) {
  await connection();
  const t = await getTranslations('AccountSettings');
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, message: t('validation.invalidJson') }, { status: 400 });
  }

  const parsed = createAccountDetailsSchema(SC_CONFIG.PROFILE_IDENTITY.USERNAME).safeParse(body);
  if (!parsed.success) {
    const flattened = parsed.error.flatten().fieldErrors;
    const fieldErrors: AccountDetailsFieldErrors = {};
    for (const field of ['firstName', 'lastName', 'username', 'language', 'extension'] as const) {
      if (flattened[field]?.length) fieldErrors[field] = t(`validation.${field}`);
    }
    return NextResponse.json({ ok: false, message: t('validation.checkFields'), fieldErrors }, { status: 422 });
  }

  const extension = accountProfileExtensionSchema.safeParse(parsed.data.extension);
  if (!extension.success) {
    return NextResponse.json(
      { ok: false, message: t('validation.extension'), fieldErrors: { extension: t('validation.extension') } },
      { status: 422 },
    );
  }

  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user || user.is_anonymous) {
    return NextResponse.json({ ok: false, message: t('validation.authentication') }, { status: 401 });
  }
  if (!user.email_confirmed_at) {
    return NextResponse.json({ ok: false, message: t('validation.verifyEmail') }, { status: 403 });
  }

  const username = SC_CONFIG.PROFILE_IDENTITY.USERNAME === 'disabled' ? '' : parsed.data.username;
  const { error: profileError } = await supabase.schema('api').rpc('update_account_profile_by_current_user', {
    input_first_name: parsed.data.firstName,
    input_last_name: parsed.data.lastName,
    ...(username ? { input_username: username } : {}),
  });
  if (profileError) {
    const usernameConflict = profileError.code === '23505';
    return NextResponse.json(
      {
        ok: false,
        message: usernameConflict ? t('validation.usernameTaken') : t('validation.profileUpdate'),
        ...(usernameConflict ? { fieldErrors: { username: t('validation.usernameTaken') } } : {}),
      },
      { status: usernameConflict ? 409 : 400 },
    );
  }

  if (SC_CONFIG.ACCOUNT_SETTINGS.LANGUAGE) {
    const { error: languageError } = await supabase.schema('api').rpc('update_account_language_by_current_user', {
      input_language_code: parsed.data.language,
    });
    if (languageError) {
      return NextResponse.json({ ok: false, message: t('validation.languageUpdate') }, { status: 400 });
    }
  }

  try {
    await updateAccountProfileExtension(user.id, extension.data);
  } catch (error) {
    console.error('Account profile extension mutation failed.', error);
    return NextResponse.json({ ok: false, message: t('validation.extensionUpdate') }, { status: 500 });
  }

  revalidatePath('/account');
  const summary = await loadAccountSummary(user);
  if (!summary) return NextResponse.json({ ok: false, message: t('validation.summaryLoad') }, { status: 500 });

  const response = NextResponse.json({ ok: true, summary });
  if (SC_CONFIG.ACCOUNT_SETTINGS.LANGUAGE) {
    response.cookies.set(LOCALE_COOKIE_NAME, parsed.data.language, localeCookieOptions);
  }
  return response;
}
