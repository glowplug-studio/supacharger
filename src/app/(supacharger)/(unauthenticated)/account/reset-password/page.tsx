'use client';

/** =========================================================================
 *
 *  Supacharger - Password Reset page account/reset-password
 *
 *  Description: User can request a linkt to reset their password
 *
 *  Author: J Sharp <j@glowplug.studio>
 *
 *  License: CC BY-NC-SA 4.0
 *
 * ========================================================================= */

import { useTranslations } from 'next-intl';

import ResetPasswordForm from '@/supacharger/components/forms/reset-password-request-link-form';

export default function ResetPasswordRequestEmailPage() {
  const tPasswordResetPage = useTranslations('PasswordResetPage');

  return (
    <main id='sc_account-password-reset-page' className='sc-auth-page' data-sc-auth-page='reset-password'>
      <header className='sc-auth-page-header'>
        <h1 className='sc-auth-page-title'>{tPasswordResetPage('title')}</h1>
      </header>
      <ResetPasswordForm />
    </main>
  );
}
