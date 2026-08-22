'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  LogIn,
  Mail,
  MailCheck,
  UserPlus,
  WandSparkles,
  X,
} from 'lucide-react';
import AnimateHeight from 'react-animate-height';
import { toast } from 'react-toastify';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import OTPField from '@/components/ui/otp-field';
import {
  createUserByEmailPassword,
  loginUser,
  signInWithEmail,
  verifyOtp,
  verifySignInOtp,
} from '@/lib/supabase/supacharger/supabase-auth';
import { getSafeNextPath, withNextPath } from '@/supacharger/auth/safe-next-path';
import AuthProviderButtons, { EnabledAuthProviderIcons } from '@/supacharger/components/buttons/auth-provider-buttons';
import PasswordValidationIndicator from '@/supacharger/components/forms/password-validation-indicator';
import { ResendVerificationEmail } from '@/supacharger/components/forms/resend-verification-email';
import { UIDivider } from '@/supacharger/components/ui/divider';
import { SC_CONFIG } from '@/supacharger/supacharger-config';
import type { EmailPasswordlessMode, SignUpEmailVerificationMode } from '@/supacharger/supacharger-config-contract';
import { supabaseErrorCodeFallback, supabaseErrorCodeLocalisation } from '@/supacharger/utils/helpers';

export type AuthMode = 'signin' | 'signup';
type AuthStep = 'choose' | 'email' | 'verify-email' | 'check-email';
type PendingAction = 'password' | 'passwordless-email' | 'otp' | 'verification-email' | null;
type VerificationPurpose = 'signin' | 'signup';

interface LoginUserFormProps {
  initialMode?: AuthMode;
  nextPath?: string | null;
  onFormHeadingChange?: (heading: string) => void;
}

const emailSchema = z.string().trim().pipe(z.email());
const OTP_SUCCESS_REDIRECT_DELAY_MS = 450;

function isPasswordModeAvailable(mode: AuthMode) {
  return mode === 'signin'
    ? SC_CONFIG.AUTHENTICATION.EMAIL_PASSWORD.SIGN_IN
    : SC_CONFIG.AUTHENTICATION.EMAIL_PASSWORD.SIGN_UP;
}

function getPasswordlessEmailMode(mode: AuthMode) {
  return mode === 'signin'
    ? SC_CONFIG.AUTHENTICATION.PASSWORDLESS_EMAIL.SIGN_IN
    : SC_CONFIG.AUTHENTICATION.PASSWORDLESS_EMAIL.SIGN_UP;
}

function passwordlessModeHasOtp(mode: EmailPasswordlessMode) {
  return mode === 'otp';
}

export function shouldStartInEmailMode(initialMode: AuthMode) {
  const providerJourneyAvailable = Object.values(SC_CONFIG.AUTH_PROVDERS_ENABLED).some(Boolean);
  const emailJourneyAvailable =
    isPasswordModeAvailable(initialMode) || getPasswordlessEmailMode(initialMode) !== 'disabled';

  return emailJourneyAvailable && !providerJourneyAvailable;
}

export function LoginUserForm({ initialMode = 'signin', nextPath = null, onFormHeadingChange }: LoginUserFormProps) {
  const t = useTranslations('AuthJourney');
  const tAuthTerms = useTranslations('AuthTerms');
  const tSupabaseErrorCodes = useTranslations('SupabaseErrorCodes');
  const router = useRouter();
  const startsInEmailMode = shouldStartInEmailMode(initialMode);
  const [step, setStep] = useState<AuthStep>(startsInEmailMode ? 'email' : 'choose');
  const [choicePanelMounted, setChoicePanelMounted] = useState(!startsInEmailMode);
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordAgain, setPasswordAgain] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordIsValid, setPasswordIsValid] = useState(false);
  const [organisationHandle, setOrganisationHandle] = useState('');
  const [verificationEmail, setVerificationEmail] = useState('');
  const [verificationPurpose, setVerificationPurpose] = useState<VerificationPurpose>('signup');
  const [verificationDeliveryMode, setVerificationDeliveryMode] = useState<SignUpEmailVerificationMode>('disabled');
  const [otp, setOtp] = useState('');
  const [otpVerificationSucceeded, setOtpVerificationSucceeded] = useState(false);
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [error, setError] = useState<string | null>(null);
  const [loginFailed, setLoginFailed] = useState(false);
  const [emailNotConfirmed, setEmailNotConfirmed] = useState(false);
  const [otpFailure, setOtpFailure] = useState<'expired-or-invalid' | 'already-verified' | null>(null);
  const [, startAuthTransition] = useTransition();
  const parsedEmail = emailSchema.safeParse(email);
  const normalisedEmail = parsedEmail.success ? parsedEmail.data : email.trim();
  const passwordModeAvailable = isPasswordModeAvailable(mode);
  const passwordlessEmailMode = getPasswordlessEmailMode(mode);
  const passwordlessEmailAvailable = passwordlessEmailMode !== 'disabled';
  const emailJourneyAvailable = passwordModeAvailable || passwordlessEmailAvailable;
  const providerJourneyAvailable = Object.values(SC_CONFIG.AUTH_PROVDERS_ENABLED).some(Boolean);
  const passwordConfirmationRequired = mode === 'signup' && !showPassword;
  const passwordsMatch = passwordAgain.length > 0 && password === passwordAgain;
  const signUpVerificationMode = SC_CONFIG.AUTHENTICATION.SIGN_UP_EMAIL_VERIFICATION;
  const otpLength = SC_CONFIG.AUTHENTICATION.PASSWORDLESS_EMAIL.OTP_LENGTH;
  const offersOtpAndLink = verificationDeliveryMode === 'otp-and-link';
  const useSocialAuthLabel = t.has('useSocialAuth') ? t('useSocialAuth') : 'Use social auth';
  const createAccountInsteadLabel = t.has('createAccountInstead')
    ? t('createAccountInstead')
    : 'Create Account instead';
  const passwordlessSignInUnavailableLabel = t.has('passwordlessSignInUnavailable')
    ? t('passwordlessSignInUnavailable')
    : 'We couldn’t send a sign-in email. Check the email address, or create an account instead.';
  const enterSignInCodeLabel = t.has('enterSignInCode') ? t('enterSignInCode') : 'Enter your login code';
  const passwordlessButtonLabel =
    passwordlessEmailMode === 'otp'
      ? t.has('passwordlessOtp')
        ? t('passwordlessOtp')
        : 'Email me a sign-in code'
      : t('magicLink');
  const loginHereLabel = t.has('loginHere') ? t('loginHere') : 'Login Here';
  const getVerificationLinkLabel = t.has('getVerificationLink') ? t('getVerificationLink') : 'Get verification link';
  const safeNextPath = getSafeNextPath(nextPath);
  const postAuthPath = safeNextPath ?? SC_CONFIG.USER_REDIRECTS.AUTHED_USER.LOGIN_REDIRECT_DESTINATION;

  function pushAuthRoute(nextMode: AuthMode) {
    window.history.pushState(
      null,
      '',
      withNextPath(nextMode === 'signup' ? '/account/create' : '/account/login', safeNextPath),
    );
  }

  function clearSensitiveFields() {
    setPassword('');
    setPasswordAgain('');
    setVerificationEmail('');
    setVerificationDeliveryMode('disabled');
    setOtp('');
    setOtpVerificationSucceeded(false);
    setShowPassword(false);
    setError(null);
    setLoginFailed(false);
    setEmailNotConfirmed(false);
    setOtpFailure(null);
  }

  function togglePasswordVisibility() {
    const nextShowPassword = !showPassword;
    if (nextShowPassword) {
      setPasswordAgain('');
      setError(null);
      setLoginFailed(false);
    }
    setShowPassword(nextShowPassword);
  }

  function showProviderChoices() {
    setChoicePanelMounted(true);
    setStep('choose');
    onFormHeadingChange?.(`${t('signIn')} / ${t('signUp')}`);
    clearSensitiveFields();
  }

  function returnToEmail() {
    setStep('email');
    onFormHeadingChange?.(mode === 'signup' ? t('signUp') : t('signIn'));
    clearSensitiveFields();
  }

  function switchAuthMode(nextMode: AuthMode) {
    setMode(nextMode);
    setStep('email');
    pushAuthRoute(nextMode);
    onFormHeadingChange?.(nextMode === 'signup' ? t('signUp') : t('signIn'));
    clearSensitiveFields();
  }

  function validateEmail() {
    if (!parsedEmail.success) {
      setError(t('validEmail'));
      return false;
    }
    return true;
  }

  function getAuthErrorMessage(
    authError: { code: string; status: number | null },
    fallback: 'authenticationFailed' | 'emailSendFailed' | 'invalidCode',
  ) {
    const messageKey = supabaseErrorCodeLocalisation(authError.code, authError.status);
    if (messageKey === 'genericError') return t(fallback);
    return tSupabaseErrorCodes.has(messageKey)
      ? tSupabaseErrorCodes(messageKey)
      : supabaseErrorCodeFallback(messageKey);
  }

  function getSignInDeliveryMessage() {
    return t.has('signInCodeSent')
      ? t('signInCodeSent', { email: verificationEmail, length: otpLength })
      : `We sent a ${otpLength}-digit sign-in code to ${verificationEmail}.`;
  }

  async function submitPassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoginFailed(false);
    setEmailNotConfirmed(false);
    if (!validateEmail()) {
      event.preventDefault();
      return;
    }
    if (!password) {
      event.preventDefault();
      setError(t('enterPassword'));
      return;
    }
    if (mode === 'signup' && (!passwordIsValid || (passwordConfirmationRequired && password !== passwordAgain))) {
      event.preventDefault();
      setError(
        passwordConfirmationRequired && password !== passwordAgain ? t('passwordMismatch') : t('strongerPassword'),
      );
      return;
    }

    if (mode === 'signup') {
      const formData = new FormData();
      formData.set('email', normalisedEmail);
      formData.set('password', password);
      if (safeNextPath) formData.set('next', safeNextPath);
      setPendingAction('password');
      startAuthTransition(async () => {
        const result = await createUserByEmailPassword(formData);
        setPendingAction(null);

        if (result.error) {
          setError(getAuthErrorMessage(result.error, 'authenticationFailed'));
          return;
        }

        if (result.data.userId && result.data.identityCount === 0) {
          toast.warning(tSupabaseErrorCodes('accountAlreadyExists'), SC_CONFIG.TOAST_CONFIG);
          setMode('signin');
          setStep('email');
          pushAuthRoute('signin');
          onFormHeadingChange?.(t('signIn'));
          setPasswordAgain('');
          return;
        }

        setVerificationEmail(normalisedEmail);
        setVerificationPurpose('signup');
        setVerificationDeliveryMode(signUpVerificationMode);
        if (signUpVerificationMode === 'otp' || signUpVerificationMode === 'otp-and-link') {
          setStep('verify-email');
          onFormHeadingChange?.(signUpVerificationMode === 'otp-and-link' ? t('verifyEmail') : t('enterCode'));
        } else if (signUpVerificationMode === 'link') {
          setStep('check-email');
          onFormHeadingChange?.(t('checkEmail'));
        } else {
          router.replace(postAuthPath);
          router.refresh();
        }
      });
      return;
    }

    const formData = new FormData();
    formData.set('email', normalisedEmail);
    formData.set('password', password);
    if (safeNextPath) formData.set('next', safeNextPath);
    setPendingAction('password');
    startAuthTransition(async () => {
      const result = await loginUser(formData);
      setPendingAction(null);

      if (result?.error) {
        const messageKey = supabaseErrorCodeLocalisation(result.error.code, result.error.status);
        setLoginFailed(mode === 'signin' && messageKey === 'invalidCredentials');
        setEmailNotConfirmed(mode === 'signin' && messageKey === 'emailNotConfirmed');
        setError(getAuthErrorMessage(result.error, 'authenticationFailed'));
        return;
      }

      if (SC_CONFIG.ORGANISATIONS.ENABLED && organisationHandle.trim()) {
        const contextResponse = await fetch('/api/organisations/context', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'switch', handle: organisationHandle.trim() }),
        });
        if (!contextResponse.ok) {
          setError(t('organisationFailed'));
          return;
        }
      }
      router.replace(postAuthPath);
      router.refresh();
    });
  }

  async function requestVerificationEmail() {
    if (!parsedEmail.success || pendingAction !== null) return;

    setPendingAction('verification-email');
    try {
      const response = await fetch('/api/account/resend-activation-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: normalisedEmail, next: safeNextPath }),
      });

      if (!response.ok) {
        setError(t('resendFailed'));
        return;
      }

      setVerificationEmail(normalisedEmail);
      setVerificationPurpose('signup');
      setVerificationDeliveryMode(signUpVerificationMode);
      setOtp('');
      setOtpFailure(null);
      setError(null);
      setEmailNotConfirmed(false);
      setStep('verify-email');
      onFormHeadingChange?.(signUpVerificationMode === 'otp-and-link' ? t('verifyEmail') : t('enterCode'));
    } catch {
      setError(t('resendFailed'));
    } finally {
      setPendingAction(null);
    }
  }

  function sendPasswordlessEmail() {
    setError(null);
    setLoginFailed(false);
    if (!validateEmail()) return;
    setPendingAction('passwordless-email');
    startAuthTransition(async () => {
      const result = await signInWithEmail(normalisedEmail, safeNextPath);
      setPendingAction(null);
      if (result?.error) {
        return setError(
          result.error.code === 'otp_disabled'
            ? passwordlessSignInUnavailableLabel
            : getAuthErrorMessage(result.error, 'emailSendFailed'),
        );
      }
      setVerificationEmail(normalisedEmail);
      setVerificationPurpose('signin');
      setVerificationDeliveryMode(passwordlessEmailMode);
      if (passwordlessModeHasOtp(passwordlessEmailMode)) {
        setStep('verify-email');
        onFormHeadingChange?.(enterSignInCodeLabel);
      } else {
        setStep('check-email');
        onFormHeadingChange?.(t('checkEmail'));
      }
    });
  }

  async function resendPasswordlessEmail() {
    const result = await signInWithEmail(verificationEmail, safeNextPath);
    return !result.error;
  }

  function submitOtp(value = otp) {
    if (value.length !== otpLength || !/^\d+$/.test(value)) return;
    setPendingAction('otp');
    setError(null);
    setOtpFailure(null);
    setOtpVerificationSucceeded(false);
    startAuthTransition(async () => {
      const result =
        verificationPurpose === 'signin'
          ? await verifySignInOtp(verificationEmail, value)
          : await verifyOtp(verificationEmail, value);
      if (result?.error) {
        setPendingAction(null);
        const messageKey = supabaseErrorCodeLocalisation(result.error.code, result.error.status);
        setOtp('');
        setError(getAuthErrorMessage(result.error, 'invalidCode'));
        if (messageKey === 'otpExpired') setOtpFailure('expired-or-invalid');
        if (messageKey === 'otpAlreadyVerified') setOtpFailure('already-verified');
        return;
      }
      setOtpVerificationSucceeded(true);
      await new Promise((resolve) => window.setTimeout(resolve, OTP_SUCCESS_REDIRECT_DELAY_MS));
      router.replace(
        verificationPurpose === 'signin'
          ? postAuthPath
          : safeNextPath ?? SC_CONFIG.ACCOUNT_CONFIRMED_PATH,
      );
      router.refresh();
    });
  }

  const backButton = (
    <button
      type='button'
      className='inline-flex items-center gap-2 text-sm font-semibold text-white/60 transition-colors hover:text-white'
      onClick={returnToEmail}
    >
      <ArrowLeft className='h-4 w-4' />
      {t('back')}
    </button>
  );

  function renderChooseOptions(includeEmailButton: boolean) {
    return (
      <div className='space-y-3'>
        <AuthProviderButtons />
        {includeEmailButton && emailJourneyAvailable ? (
          <>
            {providerJourneyAvailable ? <UIDivider text='or' className='py-1' /> : null}
            <Button
              type='button'
              variant='ghost'
              className='sc-auth-surface-button grid w-full grid-cols-[1.75rem_1fr_1.75rem]'
              onClick={() => {
                setStep('email');
                onFormHeadingChange?.(mode === 'signup' ? t('signUp') : t('signIn'));
              }}
            >
              <Mail className='h-5 w-5 justify-self-start' />
              <span className='justify-self-center'>{t('continueEmail')}</span>
              <span aria-hidden='true' />
            </Button>
          </>
        ) : null}
      </div>
    );
  }

  if (step === 'verify-email') {
    return (
      <div className='space-y-8 text-white'>
        {backButton}
        <div className='sc-auth-surface space-y-4 px-4 py-6 text-center sm:px-6'>
          <p className='text-base text-white/90'>
            {verificationPurpose === 'signin'
              ? getSignInDeliveryMessage()
              : offersOtpAndLink
                ? t('codeAndLinkSent', { email: verificationEmail })
                : t('codeSent', { email: verificationEmail, length: otpLength })}
          </p>
          {offersOtpAndLink ? (
            <p className='text-sm leading-relaxed text-white/70'>{t('openLinkInstructions')}</p>
          ) : null}
        </div>
        <div className='sc-auth-surface space-y-5 px-4 py-6 sm:px-6'>
          <p className='text-center text-base font-medium'>{t('enterCodeOption')}</p>
          <div className='relative flex min-h-16 items-center justify-center'>
            <div
              className={`flex items-center justify-center transition-all duration-150 motion-reduce:transition-none ${
                otpVerificationSucceeded ? 'scale-95 opacity-0' : 'scale-100 opacity-100'
              }`}
            >
              {pendingAction === 'otp' ? (
                <LoadingSpinner className='h-6 w-6 text-white' label={t('verifyingCode')} />
              ) : (
                <OTPField
                  className='sc-auth-otp'
                  length={otpLength}
                  value={otp}
                  onValueChange={(value) => {
                    const digits = value.replace(/\D/g, '').slice(0, otpLength);
                    setOtp(digits);
                    if (digits.length === otpLength) void submitOtp(digits);
                  }}
                  autoFocus
                  autoComplete='one-time-code'
                />
              )}
            </div>
            <div
              className={`absolute flex items-center justify-center transition-all duration-150 motion-reduce:transition-none ${
                otpVerificationSucceeded ? 'scale-100 opacity-100' : 'pointer-events-none scale-75 opacity-0'
              }`}
              role={otpVerificationSucceeded ? 'status' : undefined}
              aria-label={otpVerificationSucceeded ? tAuthTerms('accountEmailVerified') : undefined}
              aria-hidden={!otpVerificationSucceeded}
            >
              <span className='flex h-12 w-12 items-center justify-center rounded-full bg-green-600'>
                <Check className='h-7 w-7 text-white' strokeWidth={3} aria-hidden='true' />
              </span>
            </div>
          </div>
        </div>
        {error ? (
          <p
            className={`sc_message ${otpFailure === 'already-verified' ? 'sc_message-positive' : 'sc_message-error'}`}
            role={otpFailure === 'already-verified' ? 'status' : 'alert'}
          >
            {error}
          </p>
        ) : null}
        {otpFailure && verificationPurpose === 'signup' ? (
          <Link
            href={withNextPath('/account/login', safeNextPath)}
            className='text-primary hover:text-primary/80 inline-flex items-center gap-2 text-sm font-semibold transition-colors'
          >
            <span>{loginHereLabel}</span>
            <ArrowRight className='h-4 w-4' aria-hidden='true' />
          </Link>
        ) : (
          <ResendVerificationEmail
            email={verificationEmail}
            onResend={verificationPurpose === 'signin' ? resendPasswordlessEmail : undefined}
            purpose={verificationPurpose === 'signin' ? 'signin-code' : 'signup'}
            nextPath={safeNextPath}
          />
        )}
      </div>
    );
  }

  if (step === 'check-email') {
    return (
      <div className='space-y-5 text-white'>
        {backButton}
        <div className='sc_message sc_message-positive flex items-start gap-3 text-sm leading-relaxed' role='status'>
          <div className='flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-600'>
            <MailCheck className='h-4 w-4 text-white' aria-hidden='true' />
          </div>
          <p className='pt-1'>{t('linkSent', { email: verificationEmail })}</p>
        </div>
        <ResendVerificationEmail
          email={verificationEmail}
          onResend={verificationPurpose === 'signin' ? resendPasswordlessEmail : undefined}
          purpose={verificationPurpose === 'signin' ? 'signin-link' : 'signup'}
          nextPath={safeNextPath}
        />
      </div>
    );
  }

  return (
    <>
      {choicePanelMounted ? (
        <AnimateHeight
          duration={260}
          height={step === 'choose' ? 'auto' : 0}
          onHeightAnimationEnd={(height) => {
            if (height === 0 && step === 'email') setChoicePanelMounted(false);
          }}
        >
          {renderChooseOptions(true)}
        </AnimateHeight>
      ) : null}

      <AnimateHeight duration={260} height={step === 'email' ? 'auto' : 0}>
        <form onSubmit={submitPassword} className='space-y-4'>
          {providerJourneyAvailable ? (
            <Button
              type='button'
              variant='ghost'
              className='sc-auth-surface-button sc-auth-provider-switcher mb-6 w-full'
              onClick={showProviderChoices}
            >
              <span className='justify-self-start'>
                <EnabledAuthProviderIcons limit={3} />
              </span>
              <span className='justify-self-center'>{useSocialAuthLabel}</span>
              <span aria-hidden='true' />
            </Button>
          ) : null}

          <div className='mb-4 flex items-center justify-end gap-4'>
            <button
              type='button'
              className='text-primary hover:text-primary/80 inline-flex items-center gap-2 text-sm font-semibold transition-colors'
              onClick={() => switchAuthMode(mode === 'signin' ? 'signup' : 'signin')}
            >
              {mode === 'signin' ? <UserPlus className='h-4 w-4' /> : <LogIn className='h-4 w-4' />}
              {mode === 'signin' ? t('createAccount') : t('signIn')}
            </button>
          </div>

          <Input
            id='email'
            className='sc-auth-input'
            type='email'
            name='email'
            maxLength={80}
            required
            autoComplete='email'
            placeholder={t('email')}
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              setError(null);
              setEmailNotConfirmed(false);
            }}
          />

          {passwordModeAvailable && mode === 'signin' ? (
            <>
              <Input
                id='password'
                className='sc-auth-input'
                name='password'
                maxLength={80}
                type='password'
                placeholder={t('password')}
                required
                autoComplete='current-password'
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value);
                  setError(null);
                }}
              />
              {SC_CONFIG.ORGANISATIONS.ENABLED && SC_CONFIG.ORGANISATIONS.AUTHENTICATION_HANDLE !== 'disabled' ? (
                <Input
                  className='sc-auth-input'
                  type='text'
                  autoComplete='organization'
                  placeholder={
                    SC_CONFIG.ORGANISATIONS.AUTHENTICATION_HANDLE === 'required'
                      ? t('organisationHandle')
                      : t('organisationHandleOptional')
                  }
                  value={organisationHandle}
                  onChange={(event) =>
                    setOrganisationHandle(event.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))
                  }
                  required={SC_CONFIG.ORGANISATIONS.AUTHENTICATION_HANDLE === 'required'}
                />
              ) : null}
            </>
          ) : passwordModeAvailable ? (
            <div>
              <div className='relative w-full'>
                <PasswordValidationIndicator
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  name='password'
                  id='password'
                  type={showPassword ? 'text' : 'password'}
                  placeholder={t('password')}
                  onValidationChange={setPasswordIsValid}
                />
                <button
                  type='button'
                  className='absolute top-7 right-5 -translate-y-1/2 text-gray-400 hover:text-white'
                  aria-label={showPassword ? t('hidePassword') : t('showPassword')}
                  aria-expanded={!showPassword}
                  aria-controls='signup-password-confirmation'
                  onClick={togglePasswordVisibility}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              <AnimateHeight
                id='signup-password-confirmation'
                duration={260}
                height={showPassword ? 0 : 'auto'}
                animateOpacity
              >
                <div className='pt-4'>
                  <div className='relative'>
                    <Input
                      className='sc-auth-input'
                      type='password'
                      autoComplete='new-password'
                      placeholder={t('repeatPassword')}
                      value={passwordAgain}
                      onChange={(event) => setPasswordAgain(event.target.value)}
                      required={passwordConfirmationRequired}
                      disabled={showPassword}
                    />
                    {passwordsMatch ? (
                      <span className='pointer-events-none absolute top-1/2 left-[calc(100%+0.5rem)] flex -translate-y-1/2 items-center'>
                        <Check aria-hidden='true' className='text-green-500' size={17} strokeWidth={2.5} />
                      </span>
                    ) : null}
                  </div>
                </div>
              </AnimateHeight>
            </div>
          ) : null}

          {emailNotConfirmed && error ? (
            <div className='space-y-3'>
              <div className='sc_message sc_message-error' role='alert'>
                {error}
              </div>
              <button
                type='button'
                className='sc-auth-recovery-link text-primary hover:text-primary/80 mx-auto flex items-center justify-center gap-2 text-sm font-bold underline-offset-4 transition-colors hover:underline'
                disabled={pendingAction !== null}
                onClick={() => void requestVerificationEmail()}
              >
                {pendingAction === 'verification-email' ? <LoadingSpinner className='h-4 w-4' /> : null}
                <span>{getVerificationLinkLabel}</span>
                <ArrowRight className='h-4 w-4' aria-hidden='true' />
              </button>
            </div>
          ) : error && loginFailed ? (
            <div className='space-y-3'>
              <div className='sc_message sc_message-error' role='alert'>
                <div className='flex items-center justify-center gap-3'>
                  <div className='flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-600'>
                    <X className='h-4 w-4 text-white' aria-hidden='true' />
                  </div>
                  <span>{error}</span>
                </div>
              </div>
              <button
                type='button'
                className='sc-auth-recovery-link text-primary hover:text-primary/80 mx-auto flex items-center justify-center gap-2 text-sm font-bold transition-colors'
                onClick={() => switchAuthMode('signup')}
              >
                <span>{createAccountInsteadLabel}</span>
                <ArrowRight className='h-4 w-4' aria-hidden='true' />
              </button>
            </div>
          ) : error ? (
            <p className='sc_message sc_message-error' role='alert'>
              {error}
            </p>
          ) : null}

          {passwordModeAvailable ? (
            <Button
              type='submit'
              className='sc-auth-primary-button w-full gap-3'
              disabled={
                pendingAction !== null ||
                !parsedEmail.success ||
                !password ||
                (mode === 'signup' &&
                  (!passwordIsValid || (passwordConfirmationRequired && password !== passwordAgain)))
              }
            >
              {pendingAction === 'password' ? (
                <LoadingSpinner className='h-4 w-4' variant='dark' />
              ) : mode === 'signin' ? (
                <LogIn className='h-4 w-4' />
              ) : (
                <UserPlus className='h-4 w-4' />
              )}
              {mode === 'signin' ? t('signIn') : t('signUp')}
            </Button>
          ) : null}

          {passwordModeAvailable && mode === 'signin' ? (
            <Link
              href='/account/reset-password'
              className='block text-center text-sm font-semibold text-white/70 transition-colors hover:text-white'
            >
              {t('forgotPassword')}
            </Link>
          ) : null}

          {passwordlessEmailAvailable ? (
            <>
              {passwordModeAvailable ? <UIDivider text='or' className='my-5' /> : null}
              <Button
                type='button'
                className='sc-auth-primary-button w-full gap-3'
                disabled={pendingAction !== null || !parsedEmail.success}
                onClick={sendPasswordlessEmail}
              >
                {pendingAction === 'passwordless-email' ? (
                  <LoadingSpinner className='h-4 w-4' variant='dark' />
                ) : (
                  <WandSparkles className='h-4 w-4' />
                )}
                {passwordlessButtonLabel}
              </Button>
            </>
          ) : null}
        </form>
      </AnimateHeight>
    </>
  );
}
