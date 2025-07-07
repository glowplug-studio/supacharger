'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { toast } from 'react-toastify';

import InlineLoaderDark from '@/assets/images/ui/InlineLoaderDark.svg';
import OTPField from '@/components/ui/otp-field';
import { verifyOtp } from '@/lib/supabase/supacharger/supabase-auth';
import { SC_CONFIG } from '@/supacharger/supacharger-config';
import { isValidEmail, supabaseErrorCodeLocalisation } from '@/supacharger/utils/helpers';
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
        toast.error(tSupabaseErrorCodes(supabaseErrorCodeLocalisation('AuthApiError')), SC_CONFIG.TOAST_CONFIG);
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
    <div id='sc_otp-fields-verification-form' className='space-y-3'>
      <h2 className='mb-2 text-xl font-bold tracking-tight'>{tOTPFormComponent('title')}</h2>
      <p className='text-xs'>{tOTPFormComponent('description')}</p>

      <LabelPrimitive.Root htmlFor='otp-group' className='mb-2 block font-medium'>
        {tOTPFormComponent('fieldLabel')}
      </LabelPrimitive.Root>

      <div className='flex flex-col items-center justify-center rounded-md border bg-gray-100 p-5 h-28'>
        {loading ? (
          <div className='flex flex-col items-center'>
            <InlineLoaderDark />
            <span className="mt-2 text-sm text-gray-500"></span>
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
