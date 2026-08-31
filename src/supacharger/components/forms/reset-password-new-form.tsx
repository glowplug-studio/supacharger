'use client';

import { type FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Eye, EyeOff } from 'lucide-react';
import { toast } from 'react-toastify';

import SaveButton from '@/supacharger/components/buttons/form-save-button';
import PasswordValidationIndicator from '@/supacharger/components/forms/password-validation-indicator';
import { Input } from '@/supacharger/components/primitives/input';
import { SC_CONFIG } from '@/supacharger/supacharger-config';

export default function ResetPasswordNewForm() {
  const tPasswordResetPage = useTranslations('PasswordResetPage');
  const tGlobalUI = useTranslations('GlobalUI');
  const tAuthTerms = useTranslations('AuthTerms');
  const tPasswordErrors = useTranslations('evaluatePasswordStrengthErrorCodes');
  const tAuthJourney = useTranslations('AuthJourney');
  const router = useRouter();
  const [newPassword, setNewPassword] = useState('');
  const [newPasswordRetype, setNewPasswordRetype] = useState('');
  const [passwordIsValid, setPasswordIsValid] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [timer, setTimer] = useState(3);

  async function handlePasswordReset(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus(null);

    if (!passwordIsValid) {
      setStatus(tPasswordErrors('passwordUpdateFailed'));
      return;
    }
    if (newPassword !== newPasswordRetype) {
      setStatus(tPasswordErrors('provided_password_mismatch'));
      return;
    }

    setIsLoading(true);
    const response = await fetch('/api/account/recover-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ newPassword, newPasswordRetype }),
    });
    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      const errorKey = typeof result?.error === 'string' && [
        'provided_password_mismatch',
        'passwordUpdateFailed',
        'passwordTooShort',
        'password_failed_regex_evaluation',
        'mustContainLetterDigit',
        'mustContainLowerLetterUpperLetterDigit',
        'mustContainLowerLetterUpperLetterDigitSymbol',
      ].includes(result.error)
        ? result.error
        : 'passwordUpdateFailed';
      const message = tPasswordErrors(errorKey);
      toast.error(message);
      setStatus(message);
      setIsLoading(false);
      return;
    }

    toast.success(tAuthTerms('passwordUpdated'));
    setStatus(tAuthTerms('passwordUpdated'));
    setIsSuccess(true);
    setIsLoading(false);
  }

  useEffect(() => {
    if (!isSuccess) return;
    if (timer === 0) {
      router.push(SC_CONFIG.USER_REDIRECTS.AUTHED_USER.HOME_PATH);
      return;
    }

    const timeout = window.setTimeout(() => setTimer((value) => value - 1), 1000);
    return () => window.clearTimeout(timeout);
  }, [isSuccess, router, timer]);

  const togglePasswordVisibility = () => setShowPassword((visible) => !visible);

  return (
    <main id='sc_account-password-reset-new-page' className='sc-auth-page' data-sc-auth-page='new-password'>
      <header className='sc-auth-page-header'>
        <h1 className='sc-auth-page-title'>{tPasswordResetPage('title')}</h1>
      </header>

      {!isSuccess ? (
        <form onSubmit={handlePasswordReset} className='sc-auth-form'>
          <div className='sc-auth-field'>
            <label className='sc-auth-label' htmlFor='new-password'>{tAuthTerms('newPassword')}</label>
            <div className='sc-auth-password-control'>
              <PasswordValidationIndicator
                id='new-password'
                name='newPassword'
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                onValidationChange={setPasswordIsValid}
              />
              <button
                type='button'
                className='sc-auth-password-visibility'
                aria-label={showPassword ? tAuthJourney('hidePassword') : tAuthJourney('showPassword')}
                onClick={togglePasswordVisibility}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <div className='sc-auth-field'>
            <label className='sc-auth-label' htmlFor='new-password-retype'>{tAuthTerms('retypeNewPassword')}</label>
            <div className='sc-auth-password-control'>
              <Input
                id='new-password-retype'
                name='newPasswordRetype'
                type={showPassword ? 'text' : 'password'}
                autoComplete='new-password'
                className='sc-auth-input sc-auth-password-input'
                value={newPasswordRetype}
                onChange={(event) => setNewPasswordRetype(event.target.value)}
                required
              />
              <button
                type='button'
                className='sc-auth-password-visibility'
                aria-label={showPassword ? tAuthJourney('hidePassword') : tAuthJourney('showPassword')}
                onClick={togglePasswordVisibility}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {status ? <div className='sc_message sc_message-error' role='alert'>{status}</div> : null}
          <SaveButton
            isLoading={isLoading}
            isSuccess={isSuccess}
            initialLabel={tAuthTerms('setNewPassword')}
            savingLabel={tGlobalUI('buttonSaving')}
            completeLabel={tGlobalUI('buttonSaved')}
            className='sc-auth-primary-button sc-auth-submit'
          />
        </form>
      ) : (
        <div className='sc_message sc_message-positive sc-auth-reset-success' role='status'>
          <div>{status}</div>
          <div>{tPasswordResetPage('redirectingIn')} {timer}</div>
        </div>
      )}
    </main>
  );
}
