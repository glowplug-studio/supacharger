'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { ArrowRight, Check, MailCheck } from 'lucide-react';

import { LoadingSpinner as Loader2 } from '@/components/ui/loading-spinner';
import { SC_CONFIG } from '@/supacharger/supacharger-config';

type ResendMessage = {
  kind: 'success' | 'error';
  text: string;
};

type ResendPurpose = 'signup' | 'signin-code' | 'signin-link' | 'recovery';

export function ResendVerificationEmail({
  email,
  initialCooldownSeconds = SC_CONFIG.EMAIL_RESEND_COOLDOWN_SECONDS,
  nextPath = null,
  onResend,
  purpose = 'signup',
}: {
  email: string;
  initialCooldownSeconds?: number;
  nextPath?: string | null;
  onResend?: () => Promise<boolean>;
  purpose?: ResendPurpose;
}) {
  const t = useTranslations('AuthJourney');
  const tAuthTerms = useTranslations('AuthTerms');
  const signInCodeResendSuccessLabel = t.has('signInCodeResendSuccess')
    ? t('signInCodeResendSuccess')
    : 'A new login code has been sent.';
  const signInLinkResendSuccessLabel = t.has('signInLinkResendSuccess')
    ? t('signInLinkResendSuccess')
    : 'A new login link has been sent.';
  const [cooldownEndsAt, setCooldownEndsAt] = useState(() => Date.now() + initialCooldownSeconds * 1000);
  const [secondsRemaining, setSecondsRemaining] = useState(initialCooldownSeconds);
  const [isSending, setIsSending] = useState(false);
  const [message, setMessage] = useState<ResendMessage | null>(null);

  useEffect(() => {
    const update = () => {
      setSecondsRemaining(Math.max(0, Math.ceil((cooldownEndsAt - Date.now()) / 1000)));
    };
    update();
    const interval = window.setInterval(update, 1000);
    return () => window.clearInterval(interval);
  }, [cooldownEndsAt]);

  async function resend() {
    if (secondsRemaining > 0 || isSending) return;
    setIsSending(true);
    setMessage(null);

    let succeeded = false;
    try {
      if (onResend) {
        succeeded = await onResend();
      } else {
        const response = await fetch('/api/account/resend-activation-link', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, next: nextPath }),
        });
        succeeded = response.ok;
      }
    } catch {
      succeeded = false;
    }

    setIsSending(false);
    if (succeeded) {
      setSecondsRemaining(SC_CONFIG.EMAIL_RESEND_COOLDOWN_SECONDS);
      setCooldownEndsAt(Date.now() + SC_CONFIG.EMAIL_RESEND_COOLDOWN_SECONDS * 1000);
    }
    setMessage({
      kind: succeeded ? 'success' : 'error',
      text: succeeded
        ? purpose === 'recovery'
          ? (t.has('recoveryResendSuccess') && t('recoveryResendSuccess')
            ? t('recoveryResendSuccess') : 'A new password reset link has been sent.')
          : purpose === 'signin-code'
          ? signInCodeResendSuccessLabel
          : purpose === 'signin-link'
            ? signInLinkResendSuccessLabel
            : t('resendSuccess')
        : t('resendFailed'),
    });
  }

  return (
    <div className='sc-auth-resend-row'>
      <div className='sc-auth-resend-controls'>
        <p className='sc-auth-resend-copy'>{t('didNotReceive')}</p>
        {secondsRemaining > 0 ? (
          <span className='sc-auth-resend-timer' role='timer'>
            {t('sendAgainIn', { seconds: secondsRemaining })}
          </span>
        ) : null}
        {secondsRemaining === 0 || isSending || message?.kind === 'success' ? (
          <button
            type='button'
            className='sc-auth-link sc-auth-resend-button'
            disabled={isSending || secondsRemaining > 0}
            aria-busy={isSending}
            data-state={isSending ? 'sending' : secondsRemaining > 0 ? 'sent' : 'idle'}
            onClick={resend}
          >
            {isSending ? <Loader2 className='sc-auth-icon' aria-hidden='true' /> : secondsRemaining > 0 ? <Check className='sc-auth-icon' aria-hidden='true' /> : null}
            <span>{isSending ? tAuthTerms('sendNewAuthEmailSendingButtonLabel') : secondsRemaining > 0 ? tAuthTerms('sendNewAuthEmailSentButtonLabel') : t('sendAnother')}</span>
            {!isSending && secondsRemaining === 0 ? <ArrowRight className='sc-auth-icon' aria-hidden='true' /> : null}
          </button>
        ) : null}
      </div>
      {message ? (
        <div
          className={`sc_message sc-auth-message ${message.kind === 'success' ? 'sc_message-positive' : 'sc_message-error'}`}
          role={message.kind === 'success' ? 'status' : 'alert'}
        >
          {message.kind === 'success' ? (
            <div className='sc-auth-status-icon sc-auth-status-icon-success'>
              <MailCheck className='sc-auth-icon' aria-hidden='true' />
            </div>
          ) : null}
          <span>{message.text}</span>
        </div>
      ) : null}
    </div>
  );
}
