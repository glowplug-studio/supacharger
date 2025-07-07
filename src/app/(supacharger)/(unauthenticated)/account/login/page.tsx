'use client';

/** =========================================================================
 *
 *  Supacharger - Account Login Page
 *
 *  Description: User can sign in here with SOME social accounts or email.
 *
 *  Author: J Sharp <j@glowplug.studio>
 *
 *  License: CC BY-NC-SA 4.0
 *
 * ========================================================================= */

import { useTranslations } from 'next-intl';

import SCSiteLogo from '@/components/sc_demo/sc_site-logo';
import AuthProviderButtons from '@/supacharger/components/buttons/auth-provider-buttons';
import { LoginUserForm } from '@/supacharger/components/forms/login-user-form';
import { UIDivider } from '@/supacharger/components/ui/divider';

export default function SignInPage() {
  const tLoginPage = useTranslations('LoginPage');

  return (
    <main id='sc_login-page'>
      {/* Mobile only logo */}
      <div className='flex items-center gap-2 lg:hidden'>
          <div className='mb-6 w-6'>
            <SCSiteLogo showSiteTitle={true} darkMode={false} />
          </div>
        </div>
        <div className='flex flex-col gap-2 px-1'>
          <h1 className='mb-6 text-2xl/9 font-bold tracking-tight'>{tLoginPage('title')}</h1>
        </div>
        {/* Social Buttons */}
      <AuthProviderButtons />
      <LoginUserForm />
    </main>
  );
}