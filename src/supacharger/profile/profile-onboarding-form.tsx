'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

import { LoadingSpinner as Loader2 } from '@/components/ui/loading-spinner';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/supacharger/components/primitives/button';
import { Input } from '@/supacharger/components/primitives/input';
import { Label } from '@/supacharger/components/primitives/label';
import { SC_CONFIG } from '@/supacharger/supacharger-config';

type ProfileOnboardingFormProps = {
  initialProfile?: {
    first_name?: string | null;
    last_name?: string | null;
    username?: string | null;
  };
};

export function ProfileOnboardingForm({ initialProfile }: ProfileOnboardingFormProps) {
  const t = useTranslations('ProfileOnboardingForm');
  const router = useRouter();
  const usernamePolicy = SC_CONFIG.PROFILE_IDENTITY.USERNAME;
  const [firstName, setFirstName] = useState(initialProfile?.first_name ?? '');
  const [lastName, setLastName] = useState(initialProfile?.last_name ?? '');
  const [username, setUsername] = useState(initialProfile?.username ?? '');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const normalisedFirstName = firstName.trim();
    const normalisedLastName = lastName.trim();
    const normalisedUsername = username.trim();

    if (!normalisedFirstName || !normalisedLastName) {
      setError(t('nameError'));
      return;
    }
    if (usernamePolicy === 'required' && !normalisedUsername) {
      setError(t('usernameError'));
      return;
    }

    setIsSaving(true);
    const supabase = createClient();
    const { error: updateError } = await supabase
      .schema('api')
      .rpc('update_account_profile_by_current_user', {
        input_first_name: normalisedFirstName,
        input_last_name: normalisedLastName,
        ...(usernamePolicy === 'disabled' ? {} : { input_username: normalisedUsername }),
      });

    if (updateError) {
      setError(updateError.message);
      setIsSaving(false);
      return;
    }

    router.replace(SC_CONFIG.USER_REDIRECTS.AUTHED_USER.LOGIN_REDIRECT_DESTINATION);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className='space-y-5'>
      <div className='grid gap-4 sm:grid-cols-2'>
        <div className='space-y-2'>
          <Label htmlFor='profile-first-name'>{t('firstName')}</Label>
          <Input
            id='profile-first-name'
            autoComplete='given-name'
            value={firstName}
            onChange={(event) => setFirstName(event.target.value)}
            required
            maxLength={100}
          />
        </div>
        <div className='space-y-2'>
          <Label htmlFor='profile-last-name'>{t('lastName')}</Label>
          <Input
            id='profile-last-name'
            autoComplete='family-name'
            value={lastName}
            onChange={(event) => setLastName(event.target.value)}
            required
            maxLength={100}
          />
        </div>
      </div>

      {usernamePolicy !== 'disabled' ? (
        <div className='space-y-2'>
          <Label htmlFor='profile-username'>
            {t('username')}{usernamePolicy === 'optional' ? ` ${t('optional')}` : ''}
          </Label>
          <Input
            id='profile-username'
            autoComplete='username'
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            required={usernamePolicy === 'required'}
            minLength={3}
            maxLength={40}
            pattern='[A-Za-z0-9_-]+'
          />
          <p className='text-muted-foreground text-sm'>{t('usernameHelp')}</p>
        </div>
      ) : null}

      {error ? (
        <p className='sc_message sc_message-error' role='alert'>
          {error}
        </p>
      ) : null}

      <Button type='submit' disabled={isSaving} className='w-full sm:w-auto'>
        {isSaving ? <Loader2 className='mr-2 h-4 w-4' aria-hidden='true' /> : null}
        {t('continue')}
      </Button>
    </form>
  );
}
