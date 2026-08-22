'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { ArrowRight, MailCheck } from 'lucide-react';

import { LoadingSpinner as Loader2 } from '@/components/ui/loading-spinner';
import { SC_CONFIG } from '@/supacharger/supacharger-config';

type ResendMessage = {
  kind: 'success' | 'error';
  text: string;
};

type ResendPurpose = 'signup' | 'signin-code' | 'signin-link';

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
      setCooldownEndsAt(Date.now() + SC_CONFIG.EMAIL_RESEND_COOLDOWN_SECONDS * 1000);
    }
    setMessage({
      kind: succeeded ? 'success' : 'error',
      text: succeeded
        ? purpose === 'signin-code'
          ? signInCodeResendSuccessLabel
          : purpose === 'signin-link'
            ? signInLinkResendSuccessLabel
            : t('resendSuccess')
        : t('resendFailed'),
    });
  }

  return (
    <div className='space-y-3'>
      <div className='flex items-center justify-between gap-4'>
        <p className='text-sm text-white/90'>{t('didNotReceive')}</p>
        {secondsRemaining > 0 ? (
          <span className='shrink-0 text-sm font-semibold text-white/50' role='timer'>
            {t('sendAgainIn', { seconds: secondsRemaining })}
          </span>
        ) : (
          <button
            type='button'
            className='text-primary hover:text-primary/80 focus-visible:outline-primary disabled:text-primary inline-flex shrink-0 items-center gap-2 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-4'
            disabled={isSending}
            onClick={resend}
          >
            {isSending ? <Loader2 className='h-4 w-4' aria-hidden='true' /> : null}
            <span>{t('sendAnother')}</span>
            <ArrowRight className='h-4 w-4' aria-hidden='true' />
          </button>
        )}
      </div>
      {message ? (
        <div
          className={`sc_message flex items-center gap-3 ${message.kind === 'success' ? 'sc_message-positive' : 'sc_message-error'}`}
          role={message.kind === 'success' ? 'status' : 'alert'}
        >
          {message.kind === 'success' ? (
            <div className='flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-600'>
              <MailCheck className='h-4 w-4 text-white' aria-hidden='true' />
            </div>
          ) : null}
          <span>{message.text}</span>
        </div>
      ) : null}
    </div>
  );
}
