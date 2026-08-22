'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import Typewriter from 'typewriter-effect';

import SCSiteLogo from '@/components/sc_demo/sc_site-logo';
import type { AuthMode } from '@/supacharger/components/forms/login-user-form';
import {
  LoginUserForm,
  shouldStartInEmailMode,
} from '@/supacharger/components/forms/login-user-form';

export function AuthEntry({ initialMode, nextPath = null }: { initialMode: AuthMode; nextPath?: string | null }) {
  const t = useTranslations('AuthJourney');
  const initialModeHeading = initialMode === 'signup' ? t('signUp') : t('signIn');
  const initialHeading = shouldStartInEmailMode(initialMode)
    ? initialModeHeading
    : `${t('signIn')} / ${t('signUp')}`;
  const [heading, setHeading] = useState(initialHeading);
  const [typedHeading, setTypedHeading] = useState<string | null>(null);

  function handleFormHeadingChange(nextHeading: string) {
    setHeading(nextHeading);
    setTypedHeading(nextHeading);
  }

  return (
    <div className='space-y-8'>
      <div className='flex justify-center px-2 lg:hidden'>
        <SCSiteLogo showSiteTitle={true} darkMode={true} />
      </div>
      <div className='space-y-10 px-2 pt-8 pb-0 text-center sm:px-6 sm:pt-12'>
        <h1 className='text-3xl leading-tight font-semibold text-white sm:text-4xl'>{t('heroTitle')}</h1>
        <div className='min-h-8 text-2xl font-normal text-white' aria-live='polite'>
          {typedHeading ? (
            <Typewriter
              key={typedHeading}
              onInit={(typewriter) => {
                typewriter
                  .typeString(typedHeading)
                  .callFunction(() => setTypedHeading(null))
                  .start();
              }}
              options={{ autoStart: false, cursor: '', delay: 16 }}
            />
          ) : (
            heading
          )}
        </div>
      </div>
      <LoginUserForm initialMode={initialMode} nextPath={nextPath} onFormHeadingChange={handleFormHeadingChange} />
    </div>
  );
}
