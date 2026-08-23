'use client';

/** =========================================================================
 *
 *  Supacharger - Password Reset Link Request Form Component
 *
 *  Description: User can request a password reset link
 *
 *  Author: J Sharp <j@glowplug.studio>
 *
 *  License: CC BY-NC-SA 4.0
 *
 * ========================================================================= */

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { toast } from 'react-toastify';

import { Input } from '@/components/ui/input';
import { SC_CONFIG } from '@/supacharger/supacharger-config';

import SaveButton from '../buttons/form-save-button';

async function post<T = any>(url: string, data: any): Promise<T> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) throw json;
  return json;
}

export default function ResetPasswordForm() {
  const tAuthTerms = useTranslations('AuthTerms');
  const tPasswordResetPage = useTranslations('PasswordResetPage');
  const tSupabaseErrorCodes = useTranslations('SupabaseErrorCodes');

  const searchParams = useSearchParams();
  const [email, setEmail] = useState(() => searchParams.get('email') || '');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [hideEmailField, setHideEmailField] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await post('/api/account/request-password-reset', { email });
      toast.success(tPasswordResetPage('emailSent'), SC_CONFIG.TOAST_CONFIG);
      setHideEmailField(true);
      setIsSuccess(true);
      timeoutRef.current = setTimeout(() => setIsSuccess(false), 24 * 60 * 60 * 1000);
    } catch (error: any) {
      const errorMsg =
        error?.error_description || error?.error || error?.message || tSupabaseErrorCodes('genericError');
      toast.error(errorMsg, SC_CONFIG.TOAST_CONFIG);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form className='sc-auth-form' onSubmit={handleSubmit}>
      <div
        className='sc-auth-collapsible-field'
        data-hidden={hideEmailField ? 'true' : 'false'}
        aria-hidden={hideEmailField}
      >
        <label htmlFor='email' className='sc-auth-label'>
          {tPasswordResetPage('description')}
        </label>
        <div className='sc-auth-control'>
          <Input
            className='sc-auth-input'
            type='email'
            name='email'
            placeholder={tPasswordResetPage('enterEmailPlaceholder')}
            aria-label={tPasswordResetPage('enterEmailPlaceholder')}
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isSuccess}
          />
        </div>
      </div>
      <div className='sc-auth-actions sc-auth-actions-between'>
        <SaveButton
          isLoading={isLoading}
          isSuccess={isSuccess}
          initialLabel={tPasswordResetPage('getResetLink')}
          savingLabel={tAuthTerms('sendNewAuthEmailSendingButtonLabel')}
          completeLabel={tAuthTerms('sendNewAuthEmailSentButtonLabel')}
          disabled={isSuccess || isLoading}
          className='sc-auth-primary-button'
        />
        <Link className='sc-auth-link' href='/account/login'>
          {tAuthTerms('backToSignIn')}
        </Link>
      </div>
    </form>
  );
}
