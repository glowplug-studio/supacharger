'use client';

/** =========================================================================
 *
 *  Supacharger - Account Create Account Page
 *
 *  Description: User can sign up here with SOME social accounts or email.
 *
 *  Author: J Sharp <j@glowplug.studio>
 *
 *  License: CC BY-NC-SA 4.0
 *
 * ========================================================================= */

import { useTranslations } from 'next-intl';

import SCSiteLogo from '@/components/sc_demo/sc_site-logo';
import { CreateAccountForm } from '@/supacharger/components/forms/create-account-form';

export default function CreateAccountPage() {
  const tCreateAccountPage = useTranslations('CreateAccountPage');

  return (
    <main id='sc_account-create-page'>
      <div className='flex items-center gap-2 lg:hidden'>
        <div className='mb-6 w-6'>
          <SCSiteLogo showSiteTitle={true} darkMode={false} />
        </div>
      </div>
      <div className='flex flex-col gap-2'>
        <h1 className='mb-6 text-2xl/9 font-bold tracking-tight'>{tCreateAccountPage('title')}</h1>
      </div>
      <CreateAccountForm></CreateAccountForm>
    </main>
  );
}
