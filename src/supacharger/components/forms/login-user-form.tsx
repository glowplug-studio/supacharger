'use client';

/** =========================================================================
 *
 *  Supacharger - Login User Form Component
 *
 *  Description: Login form functionality along with activation link request UI
 *
 *  Author: J Sharp <j@glowplug.studio>
 *
 *  License: CC BY-NC-SA 4.0
 *
 * ========================================================================= */

import { useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { toast } from 'react-toastify';

import InlineLoader from '@/assets/images/ui/InlineLoader.svg';
import { Input } from '@/components/ui/input';
import { loginUser } from '@/lib/supabase/supacharger/supabase-auth';
import SaveButton from '@/supacharger/components/buttons/form-save-button';
import { SC_CONFIG } from '@/supacharger/supacharger-config';
import { isValidEmail, supabaseErrorCodeLocalisation } from '@/supacharger/utils/helpers';

export function LoginUserForm() {
  // Translations
  const tAuthTerms = useTranslations('AuthTerms');
  const tGlobal = useTranslations('Global');
  const tLoginPage = useTranslations('LoginPage');
  const tSupabaseErrorCodes = useTranslations('SupabaseErrorCodes');

  // State
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showEmailNotConfirmed, setShowEmailNotConfirmed] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [emailTouched, setEmailTouched] = useState(false);

  // Submit handler
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);
    setShowEmailNotConfirmed(false);

    const formData = new FormData(e.currentTarget);
    const result = await loginUser(formData);

    setIsLoading(false);

    if (result?.error) {
      const localisedCode = supabaseErrorCodeLocalisation(result.error);
      if (result.error === 'email_not_confirmed') {
        setShowEmailNotConfirmed(true);
      }
      toast.error(tSupabaseErrorCodes(localisedCode), SC_CONFIG.TOAST_CONFIG);
      return;
    }

    toast.success(tAuthTerms('loginSuccess'), SC_CONFIG.TOAST_CONFIG);
  }

  // Resend activation email handler
  async function handleResendActivation(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
    if (!isValidEmail(email)) {
      toast.error(tAuthTerms('resendConfirmationEmailFail'));
      return;
    }

    setResendLoading(true);
    setResendSuccess(false);

    try {
      const response = await fetch('/api/account/resend-activation-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const result = await response.json();
      setResendLoading(false);

      if (result?.error || !response.ok) {
        toast.error(tAuthTerms('resendConfirmationEmailFail'));
        return;
      }

      setResendSuccess(true);
      toast.success(tAuthTerms('resendConfirmationEmailSent'));
      setTimeout(() => setResendSuccess(false), 1500);
    } catch {
      setResendLoading(false);
      toast.error(tAuthTerms('resendConfirmationEmailFail'));
    }
  }

  // Handler for email field
  function handleEmailChange(e: React.ChangeEvent<HTMLInputElement>) {
    setEmail(e.target.value);
    if (!emailTouched) setEmailTouched(true);
  }

  const showLoginFields = emailTouched && email;

  return (
    <form onSubmit={handleSubmit} className='space-y-3'>
      {/* Email */}
      <div>
        <label htmlFor='email' className='text-md block px-1'>
          {tAuthTerms('emailAddress')}
        </label>
        <div className='mt-2 px-1'>
          <Input
            id='email'
            type='email'
            name='email'
            maxLength={40}
            required
            autoComplete='email'
            placeholder='me@example.com'
            value={email}
            onChange={handleEmailChange}
          />
        </div>
      </div>

      {/* Password and Submit Button: Slide Down on Email Change */}
      <div
        className={`overflow-hidden px-1 transition-all duration-300 ease-in-out ${
          showLoginFields ? 'mt-0 max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        {/* Password */}
        <div>
          <label htmlFor='password' className='mb-2 block text-sm font-medium'>
            {tAuthTerms('password')}
          </label>
          <div>
            <Input
              id='password'
              name='password'
              maxLength={40}
              type='password'
              placeholder={`${'•'.repeat(SC_CONFIG.PASSWORD_MINIMUM_LENGTH)}`}
              required
              autoComplete='current-password'
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
        </div>

        {/* Resend Activation */}
        {showEmailNotConfirmed && (
          <div className='sc_message sc_message-attention mt-4'>
            {tAuthTerms('sendNewAuthEmailLabel')}
            <div className='mt-3'>
              <SaveButton
                type='button'
                onClick={handleResendActivation}
                isLoading={resendLoading}
                isSuccess={resendSuccess}
                initialLabel={tAuthTerms('sendNewAuthEmailButtonLabel')}
                savingLabel={tAuthTerms('sendNewAuthEmailSendingButtonLabel')}
                completeLabel={tAuthTerms('sendNewAuthEmailSentButtonLabel')}
              />
            </div>
          </div>
        )}

        {/* Submit */}
        <div className='mt-4'>
          <button
            type='submit'
            disabled={isLoading}
            className='btn flex h-12 w-full justify-center rounded-md bg-primary text-white'
          >
            {isLoading ? <InlineLoader className='-ml-1 mr-3 h-4 w-4 animate-spin text-white' /> : tAuthTerms('logIn')}
          </button>
        </div>
      </div>

      {/* Links */}
      <div className='flex flex-col gap-2 px-1 md:flex-row md:items-center md:justify-between md:gap-0'>
        <div>
          <span className='text-sm font-normal'>
            {tLoginPage('newTo')} {tGlobal('siteTitle')}?{' '}
          </span>
          <Link href='/account/create' className='text-sm font-normal'>
            <span className='font-semibold'>{tAuthTerms('createAnAccount')}</span>
          </Link>
        </div>
        <Link
          href={`/account/reset-password${email ? `?email=${encodeURIComponent(email)}` : ''}`}
          title={tAuthTerms('forgotPassword')}
          className='text-sm font-semibold hover:text-indigo-500'
        >
          {tAuthTerms('forgotPassword')}
        </Link>
      </div>
    </form>
  );
}
