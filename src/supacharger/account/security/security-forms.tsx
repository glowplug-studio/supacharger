'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type ActionState = { kind: 'error' | 'success'; text: string } | null;

function StatusMessage({ state }: { state: ActionState }) {
  if (!state) return null;
  return <p className={state.kind === 'error' ? 'text-destructive text-sm' : 'text-sm text-emerald-600'} role={state.kind === 'error' ? 'alert' : 'status'}>{state.text}</p>;
}

export function SecurityForms({ email, hasPasswordIdentity, providers }: { email: string; hasPasswordIdentity: boolean; providers: string[] }) {
  const t = useTranslations('AccountSecurity');
  const [emailState, setEmailState] = useState<ActionState>(null);
  const [passwordState, setPasswordState] = useState<ActionState>(null);
  const [emailPending, setEmailPending] = useState(false);
  const [passwordPending, setPasswordPending] = useState(false);

  async function updateEmail(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setEmailPending(true);
    setEmailState(null);
    const data = new FormData(event.currentTarget);
    const response = await fetch('/api/account/email', {
      body: JSON.stringify({ email: data.get('email'), currentPassword: data.get('currentPassword') }),
      headers: { 'Content-Type': 'application/json' },
      method: 'POST',
    });
    const result = await response.json() as { ok: boolean; error?: string };
    setEmailState({ kind: result.ok ? 'success' : 'error', text: result.ok ? t('email.sent') : t(`errors.${result.error ?? 'emailUpdateFailed'}`) });
    setEmailPending(false);
  }

  async function updatePassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPasswordPending(true);
    setPasswordState(null);
    const form = event.currentTarget;
    const data = new FormData(form);
    const response = await fetch('/api/account/update-password', {
      body: JSON.stringify({
        password: data.get('currentPassword'),
        newPassword: data.get('newPassword'),
        newPasswordRetype: data.get('newPasswordRetype'),
      }),
      headers: { 'Content-Type': 'application/json' },
      method: 'POST',
    });
    const result = await response.json() as { data?: { updated: boolean }; error?: string };
    if (response.ok && result.data?.updated) {
      form.reset();
      setPasswordState({ kind: 'success', text: t('password.saved') });
    } else {
      const knownError = result.error && ['oldPasswordRequired', 'provided_password_mismatch', 'oldPasswordIncorrect', 'passwordUpdateFailed', 'unauthenticated'].includes(result.error)
        ? result.error
        : 'passwordUpdateFailed';
      setPasswordState({ kind: 'error', text: t(`errors.${knownError}`) });
    }
    setPasswordPending(false);
  }

  return (
    <>
      <section className='border-border bg-card rounded-xl border p-5 shadow-sm sm:p-6'>
        <h2 className='text-xl font-semibold'>{t('providers.title')}</h2>
        <p className='text-muted-foreground mt-1 text-sm'>{t('providers.description')}</p>
        <ul className='mt-4 flex flex-wrap gap-2' aria-label={t('providers.title')}>
          {providers.map((provider) => <li className='bg-muted rounded-full px-3 py-1 text-sm' key={provider}>{provider}</li>)}
        </ul>
      </section>

      <section className='border-border bg-card rounded-xl border p-5 shadow-sm sm:p-6'>
        <h2 className='text-xl font-semibold'>{t('email.title')}</h2>
        <p className='text-muted-foreground mt-1 text-sm'>{hasPasswordIdentity ? t('email.description') : t('email.passwordUnavailable')}</p>
        <form className='mt-5 space-y-4' onSubmit={updateEmail}>
          <div className='space-y-2'>
            <Label htmlFor='security-email'>{t('email.new')}</Label>
            <Input defaultValue={email} disabled={!hasPasswordIdentity} id='security-email' name='email' required type='email' />
          </div>
          <div className='space-y-2'>
            <Label htmlFor='security-email-password'>{t('currentPassword')}</Label>
            <Input autoComplete='current-password' disabled={!hasPasswordIdentity} id='security-email-password' name='currentPassword' required type='password' />
          </div>
          <StatusMessage state={emailState} />
          <Button disabled={!hasPasswordIdentity || emailPending} type='submit'>{emailPending ? t('saving') : t('email.save')}</Button>
        </form>
      </section>

      <section className='border-border bg-card rounded-xl border p-5 shadow-sm sm:p-6'>
        <h2 className='text-xl font-semibold'>{t('password.title')}</h2>
        <p className='text-muted-foreground mt-1 text-sm'>{hasPasswordIdentity ? t('password.description') : t('password.unavailable')}</p>
        <form className='mt-5 space-y-4' onSubmit={updatePassword}>
          <div className='space-y-2'>
            <Label htmlFor='security-current-password'>{t('currentPassword')}</Label>
            <Input autoComplete='current-password' disabled={!hasPasswordIdentity} id='security-current-password' name='currentPassword' required type='password' />
          </div>
          <div className='grid gap-4 sm:grid-cols-2'>
            <div className='space-y-2'>
              <Label htmlFor='security-new-password'>{t('password.new')}</Label>
              <Input autoComplete='new-password' disabled={!hasPasswordIdentity} id='security-new-password' name='newPassword' required type='password' />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='security-repeat-password'>{t('password.repeat')}</Label>
              <Input autoComplete='new-password' disabled={!hasPasswordIdentity} id='security-repeat-password' name='newPasswordRetype' required type='password' />
            </div>
          </div>
          <StatusMessage state={passwordState} />
          <Button disabled={!hasPasswordIdentity || passwordPending} type='submit'>{passwordPending ? t('saving') : t('password.save')}</Button>
        </form>
      </section>
    </>
  );
}
