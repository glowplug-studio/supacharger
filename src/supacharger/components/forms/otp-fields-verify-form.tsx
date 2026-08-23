'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { toast } from 'react-toastify';

import { LoadingSpinner } from '@/components/ui/loading-spinner';
import OTPField from '@/components/ui/otp-field';
import { verifyOtp } from '@/lib/supabase/supacharger/supabase-auth';
import { SC_CONFIG } from '@/supacharger/supacharger-config';
import {
  isValidEmail,
  supabaseErrorCodeFallback,
  supabaseErrorCodeLocalisation,
} from '@/supacharger/utils/helpers';
import * as LabelPrimitive from '@radix-ui/react-label';

export function OtpFieldsForm({ email }: { email: string }) {
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const tOTPFormComponent = useTranslations('OTPFormComponent');
  const tAuthTerms = useTranslations('AuthTerms');
  const tSupabaseErrorCodes = useTranslations('SupabaseErrorCodes');
  const router = useRouter();

  // Ref for OTP input
  const otpRef = useRef<HTMLInputElement | null>(null);

  // Autofocus OTP field when form is shown or when loading is toggled off (error case)
  useEffect(() => {
    if (!loading && otpRef.current) {
      otpRef.current.focus();
    }
  }, [loading]);

  const handleVerifyOtp = async (email: string, otpValue: string) => {
    if (!isValidEmail(email)) {
      toast.error(tOTPFormComponent('invalidEmail'), SC_CONFIG.TOAST_CONFIG);
      return;
    }

    setLoading(true);
    try {
      const result = await verifyOtp(email, otpValue);
      if (!result) {
        toast.error(tAuthTerms('loginSuccess'), SC_CONFIG.TOAST_CONFIG);
        setLoading(false); // Show form again
        return;
      }
      if (result.error) {
        const messageKey = supabaseErrorCodeLocalisation(result.error.code, result.error.status);
        const errorMessage = tSupabaseErrorCodes.has(messageKey)
          ? tSupabaseErrorCodes(messageKey)
          : supabaseErrorCodeFallback(messageKey);
        toast.error(errorMessage, SC_CONFIG.TOAST_CONFIG);
        setLoading(false); // Show form again
      } else {
        toast.success(tAuthTerms('accountEmailVerified'), SC_CONFIG.TOAST_CONFIG);
        // Success: keep loading spinner, redirect
        // Do NOT setLoading(false) here!
        router.push(SC_CONFIG.USER_REDIRECTS.AUTHED_USER.HOME_PATH);
      }
    } catch (err: any) {
      toast.error(tSupabaseErrorCodes(supabaseErrorCodeLocalisation('genericError')), SC_CONFIG.TOAST_CONFIG);
      setLoading(false); // Show form again
    }
  };

  const handleOtpChange = (value: string) => {
    setOtp(value);
    if (value.length === 6 && !loading) {
      handleVerifyOtp(email, value);
    }
  };

  return (
    <div id='sc_otp-fields-verification-form' className='sc-auth-otp-form'>
      <h2 className='sc-auth-otp-title'>{tOTPFormComponent('title')}</h2>
      <p className='sc-auth-otp-copy'>{tOTPFormComponent('emailSent', { email })}</p>
      <p className='sc-auth-otp-copy'>{tOTPFormComponent('description')}</p>

      <LabelPrimitive.Root htmlFor='otp-group' className='sc-auth-label'>
        {tOTPFormComponent('fieldLabel')}
      </LabelPrimitive.Root>

      <div className='sc-auth-otp-stage'>
        {loading ? (
          <div className='sc-auth-otp-loading'>
            <LoadingSpinner className='sc-auth-otp-loading-icon' label={tOTPFormComponent('verifyingCode')} />
          </div>
        ) : (
          <OTPField
            length={6}
            onValueChange={handleOtpChange}
            ref={otpRef}
            autoFocus
          />
        )}
      </div>
    </div>
  );
}
