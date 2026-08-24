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
import { Check, Eye, EyeOff } from 'lucide-react';
import AnimateHeight from 'react-animate-height';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';

import { createUserByEmailPassword } from '@/lib/supabase/supacharger/supabase-auth';
import SaveButton from '@/supacharger/components/buttons/form-save-button';
import PasswordValidationIndicator from '@/supacharger/components/forms/password-validation-indicator';
import { resolveToastOptions } from '@/supacharger/components/notifications/toast-options';
import { Input } from '@/supacharger/components/primitives/input';
import { SCP_REGISTRY } from '@/supacharger/plugins/registry';
import { SC_CONFIG } from '@/supacharger/supacharger-config';
import {
  isValidEmail,
  supabaseErrorCodeFallback,
  supabaseErrorCodeLocalisation,
} from '@/supacharger/utils/helpers';

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
  const [verificationEmail, setVerificationEmail] = useState('');
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
  const tAuthJourney = useTranslations('AuthJourney');

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

  const password = watch('password');
  const retypePassword = watch('retypePassword');
  const passwordsMatch = retypePassword.length > 0 && password === retypePassword;

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

  const togglePasswordVisibility = () => {
    const nextShowPassword = !showPassword;
    if (nextShowPassword) {
      setValue('retypePassword', '');
      setFormError(null);
    }
    setShowPassword(nextShowPassword);
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
      toast.error(tCreateAccountFormComponent('missingEmail'), resolveToastOptions(SC_CONFIG.TOAST_CONFIG));
      setFormError(tCreateAccountFormComponent('missingEmail'));
      return;
    }
    if (!data.password) {
      toast.error(tCreateAccountFormComponent('missingPassword'), resolveToastOptions(SC_CONFIG.TOAST_CONFIG));
      setFormError(tCreateAccountFormComponent('missingPassword'));
      return;
    }
    if (!showPassword && !data.retypePassword) {
      toast.error(tCreateAccountFormComponent('missingRetypePassword'), resolveToastOptions(SC_CONFIG.TOAST_CONFIG));
      setFormError(tCreateAccountFormComponent('missingRetypePassword'));
      return;
    }

    // Email format
    if (!isValidEmail(data.email)) {
      toast.error(tCreateAccountFormComponent('invalidEmail'), resolveToastOptions(SC_CONFIG.TOAST_CONFIG));
      setFormError(tCreateAccountFormComponent('invalidEmail'));
      return;
    }

    // Password strength
    if (!passwordIsValid) {
      toast.error(tEvaluatePasswordStrengthComponent('passwordNotStrongEnough'), resolveToastOptions(SC_CONFIG.TOAST_CONFIG));
      setFormError(tEvaluatePasswordStrengthComponent('passwordNotStrongEnough'));
      return;
    }

    // Password match
    if (!showPassword && data.password !== data.retypePassword) {
      toast.error(tCreateAccountFormComponent('passwordMismatch'), resolveToastOptions(SC_CONFIG.TOAST_CONFIG));
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
        const messageKey = supabaseErrorCodeLocalisation(
          result.error.code,
          result.error.status,
        );
        const errorMessage = tSupabaseErrorCodes.has(messageKey)
          ? tSupabaseErrorCodes(messageKey)
          : supabaseErrorCodeFallback(messageKey);
        setFormError(errorMessage);
        toast.error(errorMessage, resolveToastOptions(SC_CONFIG.TOAST_CONFIG));
        setIsSubmitSuccess(false);
      } else {
        if (result.data.userId && result.data.identityCount === 0) {
          toast.warning(tAuthTerms('accountAlreadyExists'), resolveToastOptions(SC_CONFIG.TOAST_CONFIG));
        } else {
          toast.success(tAuthTerms('createAccountSuccess'), resolveToastOptions(SC_CONFIG.TOAST_CONFIG));
          setVerificationEmail(data.email);
          setAccountCreated(true);
          setIsSubmitSuccess(true);
          reset();
        }
      }
    } catch (error: any) {
      setIsSubmitting(false);
      setIsSubmitSuccess(false);
      setFormError(tSupabaseErrorCodes('genericError'));
      toast.error(tSupabaseErrorCodes('genericError'), resolveToastOptions(SC_CONFIG.TOAST_CONFIG));
    }
  };

  return (
    <>
      {!accountCreated && AuthProviderButtons && (
        <div className='sc-auth-provider-section'>
          <AuthProviderButtons />
        </div>
      )}

      {!accountCreated && (
        <form onSubmit={handleSubmit(onSubmit)} className='sc-auth-form' data-has-providers={AuthProviderButtons ? 'true' : 'false'} noValidate>
          <div className='sc-auth-field'>
            <label htmlFor='email' className='sc-auth-label'>
              {tAuthTerms('emailAddress')}
            </label>
            <div className='sc-auth-control'>
              <Input
                id='email'
                type='email'
                maxLength={30}
                required
                autoComplete='email'
                className='sc-auth-input'
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
            className='sc-auth-password-section'
            data-open={passwordSectionOpen ? 'true' : 'false'}
          >
            <div className='sc-auth-field'>
              <label htmlFor='password' className='sc-auth-label'>{tAuthTerms('password')}</label>
              <div className='sc-auth-password-control'>
                <div className='sc-auth-password-strength-wrap'>
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
                  className='sc-auth-password-visibility sc-auth-password-visibility-inline'
                  aria-label={showPassword ? tAuthJourney('hidePassword') : tAuthJourney('showPassword')}
                  aria-expanded={!showPassword}
                  aria-controls='embedded-signup-password-confirmation'
                  onClick={togglePasswordVisibility}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>
            <AnimateHeight
              id='embedded-signup-password-confirmation'
              duration={260}
              height={showPassword ? 0 : 'auto'}
              animateOpacity
            >
              <div className='sc-auth-field sc-auth-password-confirmation'>
                <label htmlFor='retypePassword' className='sc-auth-label'>
                  {tAuthTerms('retypePassword')}
                </label>
                <div className='sc-auth-control'>
                  <div className='sc-auth-password-control'>
                    <Input
                      id='retypePassword'
                      type='password'
                      maxLength={30}
                      required={!showPassword}
                      disabled={showPassword}
                      autoComplete='new-password'
                      aria-invalid={!!formError && formError.toLowerCase().includes("retype")}
                      aria-describedby={getAriaError("retypePassword")}
                      {...register('retypePassword', {
                        onChange: handleRetypePasswordChange,
                      })}
                    />
                    {passwordsMatch ? (
                      <span className='sc-auth-field-valid'>
                        <Check aria-hidden='true' className='sc-auth-field-valid-icon' size={17} strokeWidth={2.5} />
                      </span>
                    ) : null}
                  </div>
                  {formError && formError.toLowerCase().includes("retype") && (
                    <div id="retypePassword-error" className="sc_message sc_message-error">{formError}</div>
                  )}
                </div>
              </div>
            </AnimateHeight>
            {BrevoNewsletterRegistrationCheckbox && <BrevoNewsletterRegistrationCheckbox />}
            {/* General password errors */}
            {formError && formError.toLowerCase().includes("password") && !formError.toLowerCase().includes("retype") && (
              <div id="password-error" className="sc_message sc_message-error">{formError}</div>
            )}
            <div className='sc-auth-actions'>
              <SaveButton
                type='submit'
                className='sc-auth-primary-button sc-auth-submit'
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
          <OtpFieldsForm email={verificationEmail} />
        </div>
      )}

      {!accountCreated && (
        <div className='sc-auth-existing-account'>
          <div>
            <span>{tCreateAccountFormComponent('iAlreadyHaveAnAccount')} </span>
            <Link href='/account/login' className='sc-auth-link'>
              <span>{tAuthTerms('logIn')}</span>
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
