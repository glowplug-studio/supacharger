'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { ArrowLeft, Eye, EyeOff, LogIn, Mail, UserPlus, WandSparkles } from 'lucide-react';
import AnimateHeight from 'react-animate-height';
import { z } from 'zod';

import InlineLoader from '@/assets/images/ui/InlineLoader.svg';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import OTPField from '@/components/ui/otp-field';
import {
  createUserByEmailPassword,
  loginUser,
  signInWithEmail,
  verifyOtp,
} from '@/lib/supabase/supacharger/supabase-auth';
import AuthProviderButtons, {
  EnabledAuthProviderIcons,
} from '@/supacharger/components/buttons/auth-provider-buttons';
import PasswordValidationIndicator from '@/supacharger/components/forms/password-validation-indicator';
import { ResendVerificationEmail } from '@/supacharger/components/forms/resend-verification-email';
import { UIDivider } from '@/supacharger/components/ui/divider';
import { SC_CONFIG } from '@/supacharger/supacharger-config';

export type AuthMode = 'signin' | 'signup';
type AuthStep = 'choose' | 'email' | 'verify-email' | 'check-email';
type PendingAction = 'password' | 'magic-link' | 'otp' | null;

interface LoginUserFormProps {
  initialMode?: AuthMode;
  onFormHeadingChange?: (heading: string) => void;
}

const emailSchema = z.string().trim().pipe(z.email());

function isPasswordModeAvailable(mode: AuthMode) {
  return mode === 'signin'
    ? SC_CONFIG.AUTHENTICATION.EMAIL_PASSWORD.SIGN_IN
    : SC_CONFIG.AUTHENTICATION.EMAIL_PASSWORD.SIGN_UP;
}

function isMagicLinkAvailable(mode: AuthMode) {
  return (
    SC_CONFIG.AUTHENTICATION.MAGIC_LINK.ENABLED &&
    (mode === 'signin' || SC_CONFIG.AUTHENTICATION.MAGIC_LINK.ALLOW_SIGN_UP)
  );
}

export function shouldStartInEmailMode(initialMode: AuthMode) {
  const providerJourneyAvailable = Object.values(SC_CONFIG.AUTH_PROVDERS_ENABLED).some(Boolean);
  const emailJourneyAvailable =
    isPasswordModeAvailable(initialMode) || isMagicLinkAvailable(initialMode);

  return emailJourneyAvailable && !providerJourneyAvailable;
}

export function LoginUserForm({
  initialMode = 'signin',
  onFormHeadingChange,
}: LoginUserFormProps) {
  const t = useTranslations('AuthJourney');
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
  const [otp, setOtp] = useState('');
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [error, setError] = useState<string | null>(null);
  const parsedEmail = emailSchema.safeParse(email);
  const normalisedEmail = parsedEmail.success ? parsedEmail.data : email.trim();
  const passwordModeAvailable = isPasswordModeAvailable(mode);
  const magicLinkAvailable = isMagicLinkAvailable(mode);
  const emailJourneyAvailable = passwordModeAvailable || magicLinkAvailable;
  const providerJourneyAvailable = Object.values(SC_CONFIG.AUTH_PROVDERS_ENABLED).some(Boolean);
  const useSocialAuthLabel = t.has('useSocialAuth') ? t('useSocialAuth') : 'Use social auth';

  function pushAuthRoute(nextMode: AuthMode) {
    window.history.pushState(null, '', nextMode === 'signup' ? '/account/create' : '/account/login');
  }

  function clearSensitiveFields() {
    setPassword('');
    setPasswordAgain('');
    setOtp('');
    setShowPassword(false);
    setError(null);
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

  async function submitPassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    if (!validateEmail()) return;
    if (!password) return setError(t('enterPassword'));
    if (mode === 'signup' && (!passwordIsValid || password !== passwordAgain)) {
      return setError(password !== passwordAgain ? t('passwordMismatch') : t('strongerPassword'));
    }

    setPendingAction('password');
    const formData = new FormData();
    formData.set('email', normalisedEmail);
    formData.set('password', password);
    const result = mode === 'signup'
      ? await createUserByEmailPassword(formData)
      : await loginUser(formData);
    setPendingAction(null);

    if (result?.error) {
      setError(t('authenticationFailed'));
      return;
    }

    if (mode === 'signin') {
      if (SC_CONFIG.ORGANISATIONS.ENABLED && organisationHandle.trim()) {
        const contextResponse = await fetch('/api/organisations/context', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'select', handle: organisationHandle.trim() }),
        });
        if (!contextResponse.ok) {
          setError(t('organisationFailed'));
          return;
        }
      }
      router.replace(SC_CONFIG.USER_REDIRECTS.AUTHED_USER.LOGIN_REDIRECT_DESTINATON);
      router.refresh();
      return;
    }

    if (SC_CONFIG.AUTHENTICATION.SIGN_UP_EMAIL_VERIFICATION === 'otp') {
      setStep('verify-email');
      onFormHeadingChange?.(t('enterCode'));
    } else if (SC_CONFIG.AUTHENTICATION.SIGN_UP_EMAIL_VERIFICATION === 'link') {
      setStep('check-email');
      onFormHeadingChange?.(t('checkEmail'));
    } else {
      router.replace(SC_CONFIG.USER_REDIRECTS.AUTHED_USER.LOGIN_REDIRECT_DESTINATON);
      router.refresh();
    }
  }

  async function sendMagicLink() {
    setError(null);
    if (!validateEmail()) return;
    setPendingAction('magic-link');
    const result = await signInWithEmail(normalisedEmail);
    setPendingAction(null);
    if (result?.error) return setError(t('emailSendFailed'));
    setStep('check-email');
    onFormHeadingChange?.(t('checkEmail'));
  }

  async function submitOtp(value = otp) {
    if (!/^\d{6}$/.test(value)) return;
    setPendingAction('otp');
    setError(null);
    const result = await verifyOtp(normalisedEmail, value);
    setPendingAction(null);
    if (result?.error) {
      setOtp('');
      setError(t('invalidCode'));
      return;
    }
    router.replace(SC_CONFIG.ACCOUNT_CONFIRMED_PATH);
    router.refresh();
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
      <div className='space-y-5 text-white'>
        {backButton}
        <div className='space-y-2'>
          <h2 className='text-xl font-semibold'>{t('enterCode')}</h2>
          <p className='text-sm text-white/60'>{t('codeSent', { email: normalisedEmail })}</p>
        </div>
        <div className='sc-auth-surface flex min-h-24 items-center justify-center p-4'>
          {pendingAction === 'otp' ? (
            <InlineLoader className='h-6 w-6 animate-spin [&_circle]:stroke-white' aria-label={t('verifyingCode')} />
          ) : (
            <OTPField
              className='sc-auth-otp'
              length={6}
              value={otp}
              onValueChange={(value) => {
                const digits = value.replace(/\D/g, '').slice(0, 6);
                setOtp(digits);
                if (digits.length === 6) void submitOtp(digits);
              }}
              autoFocus
              autoComplete='one-time-code'
            />
          )}
        </div>
        {error ? <p className='sc_message sc_message-error' role='alert'>{error}</p> : null}
        <ResendVerificationEmail email={normalisedEmail} />
      </div>
    );
  }

  if (step === 'check-email') {
    return (
      <div className='space-y-5 text-white'>
        {backButton}
        <div className='sc-auth-surface space-y-2 p-5'>
          <h2 className='text-xl font-semibold'>{t('checkEmail')}</h2>
          <p className='text-sm text-white/60'>{t('linkSent', { email: normalisedEmail })}</p>
        </div>
        {mode === 'signup' ? <ResendVerificationEmail email={normalisedEmail} /> : null}
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
              className='sc-auth-surface-button mb-6 flex w-full items-center justify-center gap-3'
              onClick={showProviderChoices}
            >
              <EnabledAuthProviderIcons limit={3} />
              <span>{useSocialAuthLabel}</span>
            </Button>
          ) : null}

          <div className='mb-4 flex items-center justify-end gap-4'>
            <button
              type='button'
              className='text-primary inline-flex items-center gap-2 text-sm font-semibold transition-colors hover:text-primary/80'
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
                  placeholder={SC_CONFIG.ORGANISATIONS.AUTHENTICATION_HANDLE === 'required' ? t('organisationHandle') : t('organisationHandleOptional')}
                  value={organisationHandle}
                  onChange={(event) => setOrganisationHandle(event.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                  required={SC_CONFIG.ORGANISATIONS.AUTHENTICATION_HANDLE === 'required'}
                />
              ) : null}
            </>
          ) : passwordModeAvailable ? (
            <>
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
                  onClick={() => setShowPassword((value) => !value)}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              <Input
                className='sc-auth-input'
                type={showPassword ? 'text' : 'password'}
                autoComplete='new-password'
                placeholder={t('repeatPassword')}
                value={passwordAgain}
                onChange={(event) => setPasswordAgain(event.target.value)}
                required
              />
            </>
          ) : null}

          {error ? <p className='sc_message sc_message-error' role='alert'>{error}</p> : null}

          {passwordModeAvailable ? (
            <Button
              type='submit'
              className='sc-auth-primary-button w-full gap-3'
              disabled={pendingAction !== null || !parsedEmail.success || !password || (mode === 'signup' && (!passwordIsValid || password !== passwordAgain))}
            >
              {pendingAction === 'password' ? <InlineLoader className='h-4 w-4 animate-spin [&_circle]:stroke-black' /> : mode === 'signin' ? <LogIn className='h-4 w-4' /> : <UserPlus className='h-4 w-4' />}
              {mode === 'signin' ? t('signIn') : t('signUp')}
            </Button>
          ) : null}

          {passwordModeAvailable && mode === 'signin' ? (
            <Link href='/account/reset-password' className='block text-center text-sm font-semibold text-white/70 transition-colors hover:text-white'>
              {t('forgotPassword')}
            </Link>
          ) : null}

          {magicLinkAvailable ? (
            <>
              {passwordModeAvailable ? <UIDivider text='or' className='my-5' /> : null}
              <Button
                type='button'
                className='sc-auth-primary-button w-full gap-3'
                disabled={pendingAction !== null || !parsedEmail.success}
                onClick={sendMagicLink}
              >
                {pendingAction === 'magic-link' ? <InlineLoader className='h-4 w-4 animate-spin [&_circle]:stroke-black' /> : <WandSparkles className='h-4 w-4' />}
                {t('magicLink')}
              </Button>
            </>
          ) : null}
        </form>
      </AnimateHeight>
    </>
  );
}
