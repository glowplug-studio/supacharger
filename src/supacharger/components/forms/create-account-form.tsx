'use client';

/** =========================================================================
 *
 *  Supacharger - Account - Create Account Form
 *
 *  Description: Main form component showing enabled login methods including OTP verification
 *
 *  Author: J Sharp <j@glowplug.studio>
 *
 *  License: CC BY-NC-SA 4.0
 *
 * ========================================================================= */

import { useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Eye, EyeOff } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';

import { Input } from '@/components/ui/input';
import { createUserByEmailPassword } from '@/lib/supabase/supacharger/supabase-auth';
import SaveButton from '@/supacharger/components/buttons/form-save-button';
import PasswordValidationIndicator from '@/supacharger/components/forms/password-validation-indicator';
import { SCP_REGISTRY } from '@/supacharger/plugins/registry';
import { SC_CONFIG } from '@/supacharger/supacharger-config';
import { isValidEmail, supabaseErrorCodeLocalisation } from '@/supacharger/utils/helpers';

import { OtpFieldsForm } from './otp-fields-verify-form';

// Dynamically import social and Brevo components if enabled
const AuthProviderButtons = Object.values(SC_CONFIG.AUTH_PROVDERS_ENABLED).some(Boolean)
  ? dynamic(() => import('@/supacharger/components/buttons/auth-provider-buttons'), { ssr: true })
  : null;

const BrevoNewsletterRegistrationCheckbox = SCP_REGISTRY.BREVO.ENABLED
  ? dynamic(() => import('@/supacharger/plugins/scp_brevo/brevoNewsletterRegistrationCheckbox'), { ssr: true })
  : null;

export function CreateAccountForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [accountCreated, setAccountCreated] = useState(false);
  const [passwordSectionOpen, setPasswordSectionOpen] = useState(false);
  const [passwordIsValid, setPasswordIsValid] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitSuccess, setIsSubmitSuccess] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const tAuthTerms = useTranslations('AuthTerms');
  const tGlobalUI = useTranslations('GlobalUI');
  const tCreateAccountFormComponent = useTranslations('CreateAccountFormComponent');
  const tSupabaseErrorCodes = useTranslations('SupabaseErrorCodes');
  const tEvaluatePasswordStrengthComponent = useTranslations('evaluatePasswordStrengthComponent');

  // React Hook Form
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm({
    mode: 'onSubmit', // only validate on submit
    defaultValues: {
      email: '',
      password: '',
      retypePassword: '',
    },
  });

  const email = watch('email');
  const password = watch('password');

  // Open password section when email is typed
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue('email', e.target.value);
    if (!passwordSectionOpen && e.target.value.length > 0) {
      setPasswordSectionOpen(true);
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue('password', e.target.value);
  };

  const handleRetypePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue('retypePassword', e.target.value);
  };

  // Helper: which field is in error? (for aria-describedby)
  const getAriaError = (field: string) => {
    if (!formError) return undefined;
    const err = formError.toLowerCase();
    if (field === "email" && err.includes("email")) return "email-error";
    if (field === "password" && err.includes("password") && !err.includes("retype")) return "password-error";
    if (field === "retypePassword" && err.includes("retype")) return "retypePassword-error";
    return undefined;
  };

  // Form submit
  const onSubmit = async (data: any) => {
    setFormError(null);

    // Required fields
    if (!data.email) {
      toast.error(tCreateAccountFormComponent('missingEmail'), SC_CONFIG.TOAST_CONFIG);
      setFormError(tCreateAccountFormComponent('missingEmail'));
      return;
    }
    if (!data.password) {
      toast.error(tCreateAccountFormComponent('missingPassword'), SC_CONFIG.TOAST_CONFIG);
      setFormError(tCreateAccountFormComponent('missingPassword'));
      return;
    }
    if (!showPassword && !data.retypePassword) {
      toast.error(tCreateAccountFormComponent('missingRetypePassword'), SC_CONFIG.TOAST_CONFIG);
      setFormError(tCreateAccountFormComponent('missingRetypePassword'));
      return;
    }

    // Email format
    if (!isValidEmail(data.email)) {
      toast.error(tCreateAccountFormComponent('invalidEmail'), SC_CONFIG.TOAST_CONFIG);
      setFormError(tCreateAccountFormComponent('invalidEmail'));
      return;
    }

    // Password strength
    if (!passwordIsValid) {
      toast.error(tEvaluatePasswordStrengthComponent('passwordNotStrongEnough'), SC_CONFIG.TOAST_CONFIG);
      setFormError(tEvaluatePasswordStrengthComponent('passwordNotStrongEnough'));
      return;
    }

    // Password match
    if (!showPassword && data.password !== data.retypePassword) {
      toast.error(tCreateAccountFormComponent('passwordMismatch'), SC_CONFIG.TOAST_CONFIG);
      setFormError(tCreateAccountFormComponent('passwordMismatch'));
      return;
    }

    setIsSubmitting(true);
    setIsSubmitSuccess(false);

    try {
      const apiFormData = new FormData();
      apiFormData.append('email', data.email);
      apiFormData.append('password', data.password);

      const result = await createUserByEmailPassword(apiFormData);

      setIsSubmitting(false);

      if (result?.error) {
        setFormError(tSupabaseErrorCodes(supabaseErrorCodeLocalisation('signup_auth_api_error')));
        toast.error(
          tSupabaseErrorCodes(supabaseErrorCodeLocalisation('signup_auth_api_error')),
          SC_CONFIG.TOAST_CONFIG
        );
        setIsSubmitSuccess(false);
      } else {
        if (
          result?.data?.user?.id &&
          Array.isArray(result.data.user.identities) &&
          result.data.user.identities.length === 0
        ) {
          toast.warning(tAuthTerms('accountAlreadyExists'), SC_CONFIG.TOAST_CONFIG);
        } else {
          toast.success(tAuthTerms('createAccountSuccess'), SC_CONFIG.TOAST_CONFIG);
          setAccountCreated(true);
          setIsSubmitSuccess(true);
          reset();
        }
      }
    } catch (error: any) {
      setIsSubmitting(false);
      setIsSubmitSuccess(false);
      setFormError(tSupabaseErrorCodes('genericError'));
      toast.error(tSupabaseErrorCodes('genericError'), SC_CONFIG.TOAST_CONFIG);
    }
  };

  return (
    <>
      {!accountCreated && AuthProviderButtons && (
        <div className='social-auth-container'>
          <AuthProviderButtons />
        </div>
      )}

      {!accountCreated && (
        <form onSubmit={handleSubmit(onSubmit)} className={AuthProviderButtons ? 'mt-6' : ''} noValidate>
          <div className='my-2'>
            <label htmlFor='email' className='text-md block px-1'>
              {tAuthTerms('emailAddress')}
            </label>
            <div className='mt-2 px-1'>
              <Input
                id='email'
                type='email'
                maxLength={30}
                required
                autoComplete='email'
                className='input'
                aria-invalid={!!formError && formError.toLowerCase().includes("email")}
                aria-describedby={getAriaError("email")}
                {...register('email', {
                  onChange: handleEmailChange,
                })}
              />
              {formError && formError.toLowerCase().includes("email") && (
                <div id="email-error" className="sc_message sc_message-error">{formError}</div>
              )}
            </div>
          </div>
          <div
            id='sc_passwords-submit'
            className={`
              transition-all duration-500
              ${passwordSectionOpen ? 'max-h-[1000px]' : 'max-h-0 overflow-hidden'}
            `}
          >
            <div className='mb-4 mt-2'>
              <div className='mt-2 flex items-center'>
                <div className='flex-1'>
                  <PasswordValidationIndicator
                    value={password}
                    onChange={handlePasswordChange}
                    name='password'
                    id='password'
                    type={showPassword ? 'text' : 'password'}
                    onValidationChange={(isValid) => setPasswordIsValid(isValid)}
                  />
                </div>
                <button
                  type='button'
                  className='ml-2 mt-4 text-gray-400 hover:text-slate-800'
                  aria-label='Show password'
                  onClick={() => setShowPassword((v) => !v)}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>
            {!showPassword && (
              <div className='my-2'>
                <label htmlFor='retypePassword' className='text-md block px-1'>
                  {tAuthTerms('retypePassword')}
                </label>
                <div className='mt-2 px-1'>
                  <Input
                    id='retypePassword'
                    type='password'
                    maxLength={30}
                    required
                    autoComplete='new-password'
                    aria-invalid={!!formError && formError.toLowerCase().includes("retype")}
                    aria-describedby={getAriaError("retypePassword")}
                    {...register('retypePassword', {
                      onChange: handleRetypePasswordChange,
                    })}
                  />
                  {formError && formError.toLowerCase().includes("retype") && (
                    <div id="retypePassword-error" className="sc_message sc_message-error">{formError}</div>
                  )}
                </div>
              </div>
            )}
            {BrevoNewsletterRegistrationCheckbox && <BrevoNewsletterRegistrationCheckbox />}
            {/* General password errors */}
            {formError && formError.toLowerCase().includes("password") && !formError.toLowerCase().includes("retype") && (
              <div id="password-error" className="sc_message sc_message-error mx-1">{formError}</div>
            )}
            <div className='mt-4 px-1'>
              <SaveButton
                type='submit'
                className='w-full h-12'
                isLoading={isSubmitting}
                isSuccess={isSubmitSuccess}
                initialLabel={tAuthTerms('signUp')}
                savingLabel={tGlobalUI('buttonThinking')}
                completeLabel={tGlobalUI('buttonSaved')}
              />
            </div>
          </div>
        </form>
      )}

      {accountCreated && (
        <div id='sc_otp-fields'>
          <OtpFieldsForm email={email} />
        </div>
      )}

      {!accountCreated && (
        <div className='mt-4 flex flex-col gap-2 px-1 md:flex-row md:items-center md:justify-between md:gap-0'>
          <div>
            <span className='text-sm font-normal'>{tCreateAccountFormComponent('iAlreadyHaveAnAccount')} </span>
            <Link href='/account/login' className='text-sm font-normal'>
              <span className='font-semibold'>{tAuthTerms('logIn')}</span>
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
