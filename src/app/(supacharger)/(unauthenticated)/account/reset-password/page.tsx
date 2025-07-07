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

import SCSiteLogo from '@/components/sc_demo/sc_site-logo';
import ResetPasswordForm from '@/supacharger/components/forms/reset-password-request-link-form';

export default function ResetPasswordRequestEmailPage() {
  const tPasswordResetPage = useTranslations('PasswordResetPage');

  return (
    <main id='sc_account-password-reset-page'>
      <div className='flex items-center gap-2 lg:hidden'>
        <div className='mb-6 w-6'>
          <SCSiteLogo showSiteTitle={true} darkMode={false} />
        </div>
      </div>
      <div className='flex flex-col gap-2 px-1'>
        <h1 className='mb-6 text-2xl/9 font-bold tracking-tight'>{tPasswordResetPage('title')}</h1>
      </div>
      <ResetPasswordForm></ResetPasswordForm>
    </main>
  );
}
