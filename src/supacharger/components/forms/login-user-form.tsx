'use client';

import { useRef, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { ArrowLeft, ArrowRight, Check, LogIn, Mail, MailCheck, UserPlus, WandSparkles, X } from 'lucide-react';
import AnimateHeight from 'react-animate-height';
import { toast } from 'react-toastify';
import { z } from 'zod';

import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { createClient } from '@/lib/supabase/client';
import {
  createUserByEmailPassword,
  loginUser,
  signInWithEmail,
  signUpWithEmail,
  verifyOtp,
  verifySignInOtp,
} from '@/lib/supabase/supacharger/supabase-auth';
import { getSafeNextPath, withNextPath } from '@/supacharger/auth/safe-next-path';
import { hasSignUpConsent, signUpTermsUrl } from '@/supacharger/auth/sign-up-terms';
import AuthProviderButtons, { EnabledAuthProviderIcons } from '@/supacharger/components/buttons/auth-provider-buttons';
import NewPasswordFields from '@/supacharger/components/forms/new-password-fields';
import { ResendVerificationEmail } from '@/supacharger/components/forms/resend-verification-email';
import { resolveToastOptions } from '@/supacharger/components/notifications/toast-options';
import { Button } from '@/supacharger/components/primitives/button';
import { Input } from '@/supacharger/components/primitives/input';
import { OtpField } from '@/supacharger/components/primitives/otp-field';
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
    ? SC_CONFIG.SUPABASE_AUTH.METHODS.EMAIL_PASSWORD.SIGN_IN
    : SC_CONFIG.SUPABASE_AUTH.METHODS.EMAIL_PASSWORD.SIGN_UP;
}

function getPasswordlessEmailMode(mode: AuthMode) {
  return mode === 'signin'
    ? SC_CONFIG.SUPABASE_AUTH.METHODS.PASSWORDLESS_EMAIL.SIGN_IN
    : SC_CONFIG.SUPABASE_AUTH.METHODS.PASSWORDLESS_EMAIL.SIGN_UP;
}

function passwordlessModeHasOtp(mode: EmailPasswordlessMode) {
  return mode === 'otp';
}

export function shouldStartInEmailMode(initialMode: AuthMode) {
  const providerJourneyAvailable = Object.values(SC_CONFIG.SUPABASE_AUTH.OAUTH_PROVIDERS).some(Boolean);
  const emailJourneyAvailable =
    isPasswordModeAvailable(initialMode) || getPasswordlessEmailMode(initialMode) !== 'disabled';

  return emailJourneyAvailable && !providerJourneyAvailable;
}

export function LoginUserForm({ initialMode = 'signin', nextPath = null, onFormHeadingChange }: LoginUserFormProps) {
  const t = useTranslations('AuthJourney');
  const tAuthTerms = useTranslations('AuthTerms');
  const locale = useLocale();
  const [termsAccepted, setTermsAccepted] = useState(false);
  const termsUrl = signUpTermsUrl(locale);
  const consentMissing =
    !hasSignUpConsent(termsAccepted) || (SC_CONFIG.AUTHENTICATION.SIGN_UP_TERMS.REQUIRED && !termsUrl);
  const tSupabaseErrorCodes = useTranslations('SupabaseErrorCodes');
  const router = useRouter();
  const startsInEmailMode = shouldStartInEmailMode(initialMode);
  const [step, setStep] = useState<AuthStep>(startsInEmailMode ? 'email' : 'choose');
  const [choicePanelMounted, setChoicePanelMounted] = useState(!startsInEmailMode);
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [email, setEmail] = useState('');
  const [emailInvalid, setEmailInvalid] = useState(false);
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
  const emailInputRef = useRef<HTMLInputElement>(null);
  const [, startAuthTransition] = useTransition();
  const parsedEmail = emailSchema.safeParse(email);
  const normalisedEmail = parsedEmail.success ? parsedEmail.data : email.trim();
  const passwordModeAvailable = isPasswordModeAvailable(mode);
  const passwordlessEmailMode = getPasswordlessEmailMode(mode);
  const passwordlessEmailAvailable = passwordlessEmailMode !== 'disabled';
  const emailJourneyAvailable = passwordModeAvailable || passwordlessEmailAvailable;
  const providerJourneyAvailable = Object.values(SC_CONFIG.SUPABASE_AUTH.OAUTH_PROVIDERS).some(Boolean);
  const passwordConfirmationRequired = mode === 'signup' && !showPassword;
  const signUpVerificationMode = SC_CONFIG.SUPABASE_AUTH.METHODS.SIGN_UP_EMAIL_VERIFICATION;
  const otpLength = SC_CONFIG.SUPABASE_AUTH.METHODS.PASSWORDLESS_EMAIL.OTP_LENGTH;
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

  async function completeAuthenticatedNavigation(destination: string) {
    if (SC_CONFIG.SUPABASE_AUTH.METHODS.MFA_TOTP.REQUIRED_FOR_SIGN_IN) {
      const { data: assurance, error: assuranceError } = await createClient().auth.mfa.getAuthenticatorAssuranceLevel();
      if (assuranceError) {
        setError(t('mfaStatusFailed'));
        return;
      }
      if (assurance?.nextLevel === 'aal2' && assurance.currentLevel !== 'aal2') {
        router.replace(withNextPath('/account/mfa', destination));
        router.refresh();
        return;
      }
    }
    router.replace(destination);
    router.refresh();
  }

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
    setEmailInvalid(false);
    setError(null);
    setLoginFailed(false);
    setEmailNotConfirmed(false);
    setOtpFailure(null);
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
    const inputEmail = emailInputRef.current?.value ?? email;
    const result = emailSchema.safeParse(inputEmail);
    if (!result.success) {
      setEmailInvalid(true);
      setError(t('validEmail'));
      emailInputRef.current?.focus();
      return null;
    }
    setEmailInvalid(false);
    if (result.data !== email) setEmail(result.data);
    return result.data;
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
      if (consentMissing) {
        setError(t('termsRequired'));
        return;
      }
      const formData = new FormData();
      formData.set('email', normalisedEmail);
      formData.set('password', password);
      formData.set('termsAccepted', String(termsAccepted));
      if (safeNextPath) formData.set('next', safeNextPath);
      setPendingAction('password');
      startAuthTransition(async () => {
        const result = await createUserByEmailPassword(formData);

        if (result.error) {
          setPendingAction(null);
          setError(getAuthErrorMessage(result.error, 'authenticationFailed'));
          return;
        }

        if (result.data.userId && result.data.identityCount === 0) {
          setPendingAction(null);
          toast.warning(tSupabaseErrorCodes('accountAlreadyExists'), resolveToastOptions(SC_CONFIG.TOAST_CONFIG));
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
          setPendingAction(null);
          setStep('verify-email');
          onFormHeadingChange?.(signUpVerificationMode === 'otp-and-link' ? t('verifyEmail') : t('enterCode'));
        } else if (signUpVerificationMode === 'link') {
          setPendingAction(null);
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

      if (result?.error) {
        setPendingAction(null);
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
          setPendingAction(null);
          setError(t('organisationFailed'));
          return;
        }
      }
      await completeAuthenticatedNavigation(postAuthPath);
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
    if (mode === 'signup' && consentMissing) {
      setError(t('termsRequired'));
      return;
    }
    setError(null);
    setLoginFailed(false);
    const validatedEmail = validateEmail();
    if (!validatedEmail) return;
    setPendingAction('passwordless-email');
    startAuthTransition(async () => {
      try {
        const result =
          mode === 'signup'
            ? await signUpWithEmail(validatedEmail, safeNextPath, termsAccepted)
            : await signInWithEmail(validatedEmail, safeNextPath);
        if (result?.error) {
          return setError(
            result.error.code === 'otp_disabled'
              ? passwordlessSignInUnavailableLabel
              : getAuthErrorMessage(result.error, 'emailSendFailed'),
          );
        }
        setVerificationEmail(validatedEmail);
        setVerificationPurpose(mode);
        setVerificationDeliveryMode(passwordlessEmailMode);
        if (passwordlessModeHasOtp(passwordlessEmailMode)) {
          setStep('verify-email');
          onFormHeadingChange?.(enterSignInCodeLabel);
        } else {
          setStep('check-email');
          onFormHeadingChange?.(t('checkEmail'));
        }
      } catch {
        setError(t('emailSendFailed'));
      } finally {
        setPendingAction(null);
      }
    });
  }

  async function resendPasswordlessEmail() {
    const result =
      verificationPurpose === 'signup'
        ? await signUpWithEmail(verificationEmail, safeNextPath, termsAccepted)
        : await signInWithEmail(verificationEmail, safeNextPath);
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
      await completeAuthenticatedNavigation(
        verificationPurpose === 'signin'
          ? postAuthPath
          : (safeNextPath ?? SC_CONFIG.AUTHENTICATION.ACCOUNT_CONFIRMED_PATH),
      );
    });
  }

  const backButton = (
    <button type='button' className='sc-auth-back' onClick={returnToEmail}>
      <ArrowLeft className='sc-auth-icon' />
      {t('back')}
    </button>
  );

  function renderSignUpTerms(providerChoice = false) {
    if (!termsUrl || (providerChoice ? !providerJourneyAvailable : mode !== 'signup' || !emailJourneyAvailable))
      return null;
    return (
      <label className='sc-auth-terms flex items-start gap-2'>
        {SC_CONFIG.AUTHENTICATION.SIGN_UP_TERMS.REQUIRED ? (
          <input
            type='checkbox'
            checked={termsAccepted}
            onChange={(event) => setTermsAccepted(event.target.checked)}
            required
            className='mt-1 size-4 shrink-0 accent-current'
          />
        ) : null}
        <span>
          {t.rich('signUpAgreement', {
            terms: (chunks) => (
              <a href={termsUrl} target='_blank' rel='noopener noreferrer' className='sc-auth-link sc-auth-terms-link'>
                {chunks}
              </a>
            ),
          })}
        </span>
      </label>
    );
  }

  function renderChooseOptions(includeEmailButton: boolean) {
    return (
      <div className='sc-auth-option-list'>
        <AuthProviderButtons termsAccepted={termsAccepted} disabled={consentMissing} />
        {step === 'choose' ? renderSignUpTerms(true) : null}
        {includeEmailButton && emailJourneyAvailable ? (
          <>
            {providerJourneyAvailable ? <UIDivider text='or' className='sc-auth-divider' /> : null}
            <Button
              type='button'
              variant='ghost'
              className='sc-auth-surface-button sc-auth-email-option'
              onClick={() => {
                setStep('email');
                onFormHeadingChange?.(mode === 'signup' ? t('signUp') : t('signIn'));
              }}
            >
              <Mail className='sc-auth-option-icon' />
              <span className='sc-auth-provider-label'>{t('continueEmail')}</span>
              <span aria-hidden='true' />
            </Button>
          </>
        ) : null}
      </div>
    );
  }

  if (step === 'verify-email') {
    return (
      <div className='sc-auth-verification'>
        {backButton}
        <div className='sc-auth-surface sc-auth-verification-summary'>
          <p className='sc-auth-verification-copy'>
            {verificationPurpose === 'signin'
              ? getSignInDeliveryMessage()
              : offersOtpAndLink
                ? t('codeAndLinkSent', { email: verificationEmail })
                : t('codeSent', { email: verificationEmail, length: otpLength })}
          </p>
          {offersOtpAndLink ? <p className='sc-auth-verification-help'>{t('openLinkInstructions')}</p> : null}
        </div>
        <div className='sc-auth-surface sc-auth-code-panel'>
          <p className='sc-auth-code-title'>{t('enterCodeOption')}</p>
          <div className='sc-auth-code-stage'>
            <div className='sc-auth-code-entry' data-succeeded={otpVerificationSucceeded ? 'true' : 'false'}>
              {pendingAction === 'otp' ? (
                <LoadingSpinner className='sc-auth-code-loader' label={t('verifyingCode')} />
              ) : (
                <OtpField
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
              className='sc-auth-code-success'
              data-visible={otpVerificationSucceeded ? 'true' : 'false'}
              role={otpVerificationSucceeded ? 'status' : undefined}
              aria-label={otpVerificationSucceeded ? tAuthTerms('accountEmailVerified') : undefined}
              aria-hidden={!otpVerificationSucceeded}
            >
              <span className='sc-auth-status-icon sc-auth-code-success-icon'>
                <Check className='sc-auth-code-success-check' strokeWidth={3} aria-hidden='true' />
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
          <Link href={withNextPath('/account/login', safeNextPath)} className='sc-auth-link'>
            <span>{loginHereLabel}</span>
            <ArrowRight className='sc-auth-icon' aria-hidden='true' />
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
      <div className='sc-auth-check-email'>
        {backButton}
        <div className='sc_message sc_message-positive sc-auth-message sc-auth-message-start' role='status'>
          <div className='sc-auth-status-icon sc-auth-status-icon-success'>
            <MailCheck className='sc-auth-icon' aria-hidden='true' />
          </div>
          <p className='sc-auth-message-copy'>{t('linkSent', { email: verificationEmail })}</p>
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
        <form onSubmit={submitPassword} className='sc-auth-form'>
          {providerJourneyAvailable ? (
            <Button
              type='button'
              variant='ghost'
              className='sc-auth-surface-button sc-auth-provider-switcher sc-auth-provider-switcher-spaced'
              onClick={showProviderChoices}
            >
              <span className='sc-auth-provider-switcher-icons'>
                <EnabledAuthProviderIcons limit={3} />
              </span>
              <span className='sc-auth-provider-label'>{useSocialAuthLabel}</span>
              <span aria-hidden='true' />
            </Button>
          ) : null}

          <div className='sc-auth-mode-switch'>
            <button
              type='button'
              className='sc-auth-link'
              onClick={() => switchAuthMode(mode === 'signin' ? 'signup' : 'signin')}
            >
              {mode === 'signin' ? <UserPlus className='sc-auth-icon' /> : <LogIn className='sc-auth-icon' />}
              {mode === 'signin' ? t('createAccount') : t('signIn')}
            </button>
          </div>

          <div className='sc-auth-field'>
            <label className='sc-auth-label' htmlFor='email'>
              {t('email')}
            </label>
            <Input
              ref={emailInputRef}
              id='email'
              className='sc-auth-input'
              type='email'
              name='email'
              maxLength={80}
              required
              autoComplete='email'
              placeholder={t('email')}
              value={email}
              aria-invalid={emailInvalid}
              aria-describedby={emailInvalid ? 'login-email-error' : undefined}
              onChange={(event) => {
                setEmail(event.target.value);
                setEmailInvalid(false);
                setError(null);
                setEmailNotConfirmed(false);
              }}
            />
          </div>

          {passwordModeAvailable && mode === 'signin' ? (
            <>
              <div className='sc-auth-field'>
                <label className='sc-auth-label' htmlFor='password'>
                  {t('password')}
                </label>
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
              </div>
              {SC_CONFIG.ORGANISATIONS.ENABLED && SC_CONFIG.ORGANISATIONS.AUTHENTICATION_HANDLE !== 'disabled' ? (
                <div className='sc-auth-field'>
                  <label className='sc-auth-label' htmlFor='organisation-handle'>
                    {SC_CONFIG.ORGANISATIONS.AUTHENTICATION_HANDLE === 'required'
                      ? t('organisationHandle')
                      : t('organisationHandleOptional')}
                  </label>
                  <Input
                    id='organisation-handle'
                    name='organisationHandle'
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
                </div>
              ) : null}
            </>
          ) : passwordModeAvailable ? (
            <NewPasswordFields
              id='password'
              name='password'
              label={t('password')}
              placeholder={t('password')}
              confirmationId='password-confirmation'
              confirmationName='passwordConfirmation'
              confirmationLabel={t('repeatPassword')}
              confirmationPlaceholder={t('repeatPassword')}
              password={password}
              confirmation={passwordAgain}
              visible={showPassword}
              onPasswordChange={setPassword}
              onConfirmationChange={setPasswordAgain}
              onValidationChange={setPasswordIsValid}
              onVisibilityChange={(visible) => {
                setShowPassword(visible);
                setError(null);
                setLoginFailed(false);
              }}
            />
          ) : null}

          {emailNotConfirmed && error ? (
            <div className='sc-auth-error-stack'>
              <div className='sc_message sc_message-error' role='alert'>
                {error}
              </div>
              <button
                type='button'
                className='sc-auth-link sc-auth-recovery-link'
                disabled={pendingAction !== null || (mode === 'signup' && consentMissing)}
                onClick={() => void requestVerificationEmail()}
              >
                {pendingAction === 'verification-email' ? <LoadingSpinner className='sc-auth-icon' /> : null}
                <span>{getVerificationLinkLabel}</span>
                <ArrowRight className='sc-auth-icon' aria-hidden='true' />
              </button>
            </div>
          ) : error && loginFailed ? (
            <div className='sc-auth-error-stack'>
              <div className='sc_message sc_message-error' role='alert'>
                <div className='sc-auth-message sc-auth-message-centred'>
                  <div className='sc-auth-status-icon sc-auth-status-icon-error'>
                    <X className='sc-auth-icon' aria-hidden='true' />
                  </div>
                  <span>{error}</span>
                </div>
              </div>
              <button
                type='button'
                className='sc-auth-link sc-auth-recovery-link'
                onClick={() => switchAuthMode('signup')}
              >
                <span>{createAccountInsteadLabel}</span>
                <ArrowRight className='sc-auth-icon' aria-hidden='true' />
              </button>
            </div>
          ) : error ? (
            <p id={emailInvalid ? 'login-email-error' : undefined} className='sc_message sc_message-error' role='alert'>
              {error}
            </p>
          ) : null}

          {passwordModeAvailable ? (
            <Button
              type='submit'
              className='sc-auth-primary-button sc-auth-submit'
              disabled={
                (mode === 'signup' && consentMissing) ||
                pendingAction !== null ||
                !parsedEmail.success ||
                !password ||
                (mode === 'signup' &&
                  (!passwordIsValid || (passwordConfirmationRequired && password !== passwordAgain)))
              }
            >
              {pendingAction === 'password' ? (
                <LoadingSpinner className='sc-auth-icon' variant='dark' />
              ) : mode === 'signin' ? (
                <LogIn className='sc-auth-icon' />
              ) : (
                <UserPlus className='sc-auth-icon' />
              )}
              {mode === 'signin' ? t('signIn') : t('signUp')}
            </Button>
          ) : null}

          {passwordModeAvailable && mode === 'signin' ? (
            <Link href='/account/reset-password' className='sc-auth-secondary-link'>
              {t('forgotPassword')}
            </Link>
          ) : null}

          {passwordlessEmailAvailable ? (
            <>
              {passwordModeAvailable ? (
                <UIDivider text='or' className='sc-auth-divider sc-auth-divider-spaced' />
              ) : null}
              <Button
                type='button'
                className='sc-auth-primary-button sc-auth-submit'
                disabled={pendingAction !== null || (mode === 'signup' && consentMissing)}
                onClick={sendPasswordlessEmail}
              >
                {pendingAction === 'passwordless-email' ? (
                  <LoadingSpinner className='sc-auth-icon' variant='dark' />
                ) : (
                  <WandSparkles className='sc-auth-icon' />
                )}
                {passwordlessButtonLabel}
              </Button>
            </>
          ) : null}
          {step === 'email' ? renderSignUpTerms() : null}
        </form>
      </AnimateHeight>
    </>
  );
}
