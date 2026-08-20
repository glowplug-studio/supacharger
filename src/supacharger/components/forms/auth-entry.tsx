'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import Typewriter from 'typewriter-effect';

import type { AuthMode } from '@/supacharger/components/forms/login-user-form';
import { LoginUserForm } from '@/supacharger/components/forms/login-user-form';

export function AuthEntry({ initialMode }: { initialMode: AuthMode }) {
  const t = useTranslations('AuthJourney');
  const initialHeading = initialMode === 'signup' ? t('signUp') : `${t('signIn')} / ${t('signUp')}`;
  const [heading, setHeading] = useState(initialHeading);
  const [typedHeading, setTypedHeading] = useState<string | null>(null);

  function handleFormHeadingChange(nextHeading: string) {
    setHeading(nextHeading);
    setTypedHeading(nextHeading);
  }

  return (
    <div className='space-y-8'>
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
      <LoginUserForm initialMode={initialMode} onFormHeadingChange={handleFormHeadingChange} />
    </div>
  );
}
