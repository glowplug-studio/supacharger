'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import Typewriter from 'typewriter-effect';

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
    <div className='sc-auth-entry' data-sc-auth-entry>
      <header className='sc-auth-entry-header'>
        <h1 className='sc-auth-entry-title'>{t('heroTitle')}</h1>
        <div className='sc-auth-entry-mode' aria-live='polite'>
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
      </header>
      <LoginUserForm initialMode={initialMode} nextPath={nextPath} onFormHeadingChange={handleFormHeadingChange} />
    </div>
  );
}
