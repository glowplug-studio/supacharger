'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { toast } from 'react-toastify';

import InlineLoader from '@/assets/images/ui/InlineLoader.svg';
import SCSiteLogo from '@/components/sc_demo/sc_site-logo';
import { createClient } from '@/lib/supabase/client';
import SaveButton from '@/supacharger/components/buttons/form-save-button';
import { SC_CONFIG } from '@/supacharger/supacharger-config';
import { supabaseErrorCodeLocalisation } from '@/supacharger/utils/helpers';

export default function ResetPasswordFormPage() {
  const tPasswordResetPage = useTranslations('PasswordResetPage');
  const tGlobal = useTranslations('Global');
  const tGlobalUI = useTranslations('GlobalUI');
  const tAuthTerms = useTranslations('AuthTerms');
  const tSupabaseErrorCodes = useTranslations('SupabaseErrorCodes');

  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<string | null>(null);
  const [pending, setPending] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [success, setSuccess] = useState(false);
  const [timer, setTimer] = useState(4); // seconds for redirect countdown
  const [newPassword, setNewPassword] = useState('');
  const [isCodeValid, setIsCodeValid] = useState(true);

  const code = searchParams.get('code');

  // Only exchange code if user is NOT authenticated
  useEffect(() => {
    if (!code) {
      setPending(false); // stop loader if no code
      return;
    }
    (async () => {
      setPending(true);
      setStatus(null);
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          setStatus(tPasswordResetPage('expiredCode'));
          setIsCodeValid(false);
        } else {
          setIsCodeValid(true);
        }
      } else {
        setIsCodeValid(true);
      }
      setPending(false);
    })();
  }, [code, tPasswordResetPage]);

  // Handle password reset form submission
  async function handlePasswordReset(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setStatus(null);

    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      const localised = supabaseErrorCodeLocalisation(error.code || 'genericError');
      const translated = tSupabaseErrorCodes(localised);
      toast.error(translated);
      setStatus(error.message);
      setIsLoading(false);
      return;
    }
    toast.success(tAuthTerms('passwordUpdated'));
    setIsSuccess(true);
    setSuccess(true);
    setStatus('Password updated!');
    setIsLoading(false);
    setTimer(3);
  }

  // Redirect after delay on success
  useEffect(() => {
    if (success && timer > 0) {
      const interval = setInterval(() => {
        setTimer((t) => t - 1);
      }, 1000);
      return () => clearInterval(interval);
    }
    if (success && timer === 0) {
      router.push(SC_CONFIG.USER_REDIRECTS.AUTHED_USER.HOME_PATH);
    }
  }, [success, timer, router]);

  return (
    <>
      <main id='sc_account-password-reset-page'>
        <div className='flex items-center gap-2 lg:hidden'>
          <div className='mb-6 w-6'>
            <SCSiteLogo showSiteTitle={true} darkMode={false} />
          </div>
        </div>
        <div className='flex flex-col gap-2 px-1'>
          <h1 className='mb-6 text-2xl/9 font-bold tracking-tight'>{tPasswordResetPage('title')}</h1>
        </div>

        <div>
          {pending && (
            <div className='flex items-center gap-3 rounded bg-gray-100 px-4 py-3'>
              <InlineLoader className='h-5 w-5 animate-spin text-gray-500' />
              <span className='text-gray-600'>{tPasswordResetPage('verifyingCode') || 'Verifying code...'}</span>
            </div>
          )}

          {/* If there is no code and not pending, show message and link */}
          {!pending && !code && (
            <div className='sc_message sc_message-error flex flex-col gap-2'>
              <span className='text-sm'>
                {tPasswordResetPage('noCode') || 'No reset code found. Please request a new password reset link.'}
              </span>
              <Link className='text-sm font-semibold hover:text-indigo-500' href='/account/reset-password'>
                {tAuthTerms('backToRequestLink')}
              </Link>
            </div>
          )}

          {/* Only show the rest if not pending and code exists */}
          {!pending && code && (
            <div className='space-y-4'>
              {!isCodeValid && status && (
                <div className='sc_message sc_message-error flex flex-col gap-2'>
                  <span>{status}</span>
                  <Link className='text-sm font-semibold hover:text-indigo-500' href='/account/login'>
                    {tAuthTerms('backToSignIn')}
                  </Link>
                </div>
              )}
              {isCodeValid && !success && (
                <form onSubmit={handlePasswordReset} className='space-y-4'>
                  <label className='mb-2 block font-medium'>{tAuthTerms('newPassword')}</label>
                  <input
                    type='password'
                    required
                    minLength={8}
                    className='input w-full'
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    disabled={isLoading}
                  />
                  <SaveButton
                    isLoading={isLoading}
                    isSuccess={isSuccess}
                    initialLabel={tGlobalUI('buttonSaveChanges')}
                    savingLabel={tGlobalUI('buttonSaving')}
                    completeLabel={tGlobalUI('buttonSaved')}
                  />
                </form>
              )}
              {success && (
                <div className='mt-4 rounded-sm bg-green-100 py-4 text-center font-medium text-green-800'>
                  <div>
                    {tPasswordResetPage('redirectingIn')} {timer}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
