'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Eye, EyeOff } from 'lucide-react';
import { toast } from 'react-toastify';

import PasswordValidationIndicator from '@/supacharger/components/forms/password-validation-indicator';
import { resolveToastOptions } from '@/supacharger/components/notifications/toast-options';
import { SC_CONFIG } from '@/supacharger/supacharger-config';

type ActionState = { kind: 'error' | 'success'; text: string } | null;

function StatusMessage({ state }: { state: ActionState }) {
  if (!state) return null;
  return <p className='sc-account-status' data-kind={state.kind} role={state.kind === 'error' ? 'alert' : 'status'}>{state.text}</p>;
}

export function SecurityForms({ currentMethod, email, hasPasswordIdentity, pendingEmail, providers }: {
  currentMethod: string;
  email: string;
  hasPasswordIdentity: boolean;
  pendingEmail: string | null;
  providers: string[];
}) {
  const t = useTranslations('AccountSecurity');
  const tSupabaseErrors = useTranslations('SupabaseErrorCodes');
  const [emailState, setEmailState] = useState<ActionState>(null);
  const [passwordState, setPasswordState] = useState<ActionState>(null);
  const [emailPending, setEmailPending] = useState(false);
  const [passwordPending, setPasswordPending] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [repeatPassword, setRepeatPassword] = useState('');
  const [passwordIsValid, setPasswordIsValid] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  function publish(state: Exclude<ActionState, null>) {
    const options = resolveToastOptions(SC_CONFIG.TOAST_CONFIG);
    if (state.kind === 'success') toast.success(state.text, options);
    else toast.error(state.text, options);
    return state;
  }

  async function updateEmail(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setEmailPending(true);
    setEmailState(null);
    try {
      const data = new FormData(event.currentTarget);
      const response = await fetch('/api/account/email', {
        body: JSON.stringify({ email: data.get('email'), currentPassword: data.get('currentPassword') }),
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
      });
      const result = await response.json() as { ok: boolean; error?: string };
      setEmailState(publish({ kind: result.ok ? 'success' : 'error', text: result.ok ? t('email.sent') : t(`errors.${result.error ?? 'emailUpdateFailed'}`) }));
    } catch {
      setEmailState(publish({ kind: 'error', text: t('errors.emailUpdateFailed') }));
    } finally {
      setEmailPending(false);
    }
  }

  async function updatePassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPasswordPending(true);
    setPasswordState(null);
    const form = event.currentTarget;
    const data = new FormData(form);
    try {
      const response = await fetch('/api/account/update-password', {
        body: JSON.stringify({ password: data.get('currentPassword'), newPassword, newPasswordRetype: repeatPassword }),
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
      });
      const result = await response.json() as { data?: { updated: boolean }; error?: string };
      if (response.ok && result.data?.updated) {
        form.reset();
        setNewPassword('');
        setRepeatPassword('');
        setPasswordState(publish({ kind: 'success', text: t('password.saved') }));
      } else {
        const knownError = result.error && ['oldPasswordRequired', 'provided_password_mismatch', 'oldPasswordIncorrect', 'passwordUpdateFailed', 'unauthenticated'].includes(result.error) ? result.error : 'passwordUpdateFailed';
        const message = result.error === 'samePassword'
          ? tSupabaseErrors('samePassword')
          : t(`errors.${knownError}`);
        setPasswordState(publish({ kind: 'error', text: message }));
      }
    } catch {
      setPasswordState(publish({ kind: 'error', text: t('errors.passwordUpdateFailed') }));
    } finally {
      setPasswordPending(false);
    }
  }

  return (
    <>
      <section className='sc-account-section'>
        <h2 className='sc-account-section-title'>{t('providers.title')}</h2>
        <p className='sc-account-section-description'>{t('providers.signedInWith', { method: currentMethod })}</p>
        <p className='sc-account-section-description'>{t('providers.description')}</p>
        <ul className='sc-account-provider-list' aria-label={t('providers.linkedLabel')}>
          {providers.map((provider) => <li className='sc-account-provider' key={provider}>{provider}</li>)}
        </ul>
      </section>

      <section className='sc-account-section'>
        <h2 className='sc-account-section-title'>{t('email.title')}</h2>
        <p className='sc-account-section-description'>{hasPasswordIdentity ? t('email.description') : t('email.passwordUnavailable')}</p>
        {pendingEmail ? <p className='sc-account-pending-email' role='status'>{t('email.pending', { email: pendingEmail })}</p> : null}
        <form className='sc-account-form' onSubmit={updateEmail}>
          <label className='sc-account-field'><span className='sc-account-label'>{t('email.new')}</span><input className='sc-account-input' defaultValue={email} disabled={!hasPasswordIdentity} name='email' required type='email' /></label>
          <label className='sc-account-field'><span className='sc-account-label'>{t('currentPassword')}</span><input className='sc-account-input' autoComplete='current-password' disabled={!hasPasswordIdentity} name='currentPassword' required type='password' /></label>
          <StatusMessage state={emailState} />
          <button className='sc-account-submit' disabled={!hasPasswordIdentity || emailPending} type='submit'>{emailPending ? t('saving') : t('email.save')}</button>
        </form>
      </section>

      <section className='sc-account-section'>
        <h2 className='sc-account-section-title'>{t('password.title')}</h2>
        <p className='sc-account-section-description'>{hasPasswordIdentity ? t('password.description') : t('password.unavailable')}</p>
        <form className='sc-account-form' onSubmit={updatePassword}>
          <label className='sc-account-field'><span className='sc-account-label'>{t('currentPassword')}</span><input className='sc-account-input' autoComplete='current-password' disabled={!hasPasswordIdentity} name='currentPassword' required type='password' /></label>
          <div className='sc-account-password-grid'>
            <label className='sc-account-field'><span className='sc-account-label'>{t('password.new')}</span><span className='sc-account-password-control'><PasswordValidationIndicator id='security-new-password' name='newPassword' type={showPassword ? 'text' : 'password'} value={newPassword} onChange={(event) => setNewPassword(event.target.value)} onValidationChange={setPasswordIsValid} /><button aria-label={showPassword ? t('password.hide') : t('password.show')} className='sc-account-password-toggle' type='button' onClick={() => setShowPassword((shown) => !shown)}>{showPassword ? <EyeOff aria-hidden='true' /> : <Eye aria-hidden='true' />}</button></span></label>
            <label className='sc-account-field'><span className='sc-account-label'>{t('password.repeat')}</span><input className='sc-account-input' autoComplete='new-password' disabled={!hasPasswordIdentity} name='newPasswordRetype' required type={showPassword ? 'text' : 'password'} value={repeatPassword} onChange={(event) => setRepeatPassword(event.target.value)} /></label>
          </div>
          <StatusMessage state={passwordState} />
          <button className='sc-account-submit' disabled={!hasPasswordIdentity || passwordPending || !passwordIsValid || newPassword !== repeatPassword} type='submit'>{passwordPending ? t('saving') : t('password.save')}</button>
        </form>
      </section>
    </>
  );
}
