'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { SC_CONFIG } from '@/supacharger/supacharger-config';

export function ResendVerificationEmail({
  email,
  initialCooldownSeconds = SC_CONFIG.EMAIL_RESEND_COOLDOWN_SECONDS,
}: {
  email: string;
  initialCooldownSeconds?: number;
}) {
  const t = useTranslations('AuthJourney');
  const [cooldownEndsAt, setCooldownEndsAt] = useState(
    () => Date.now() + initialCooldownSeconds * 1000,
  );
  const [secondsRemaining, setSecondsRemaining] = useState(initialCooldownSeconds);
  const [isSending, setIsSending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

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

    const response = await fetch('/api/account/resend-activation-link', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });

    setIsSending(false);
    setCooldownEndsAt(Date.now() + SC_CONFIG.EMAIL_RESEND_COOLDOWN_SECONDS * 1000);
    setMessage(response.ok ? t('resendSuccess') : t('resendFailed'));
  }

  return (
    <div className='sc-auth-resend'>
      <p className='text-sm text-white/60'>{t('didNotReceive')}</p>
      <Button type='button' variant='ghost' className='sc-auth-surface-button w-full' disabled={secondsRemaining > 0 || isSending} onClick={resend}>
        {isSending ? <Loader2 className='h-4 w-4 animate-spin' aria-hidden='true' /> : null}
        {secondsRemaining > 0 ? t('sendAgainIn', { seconds: secondsRemaining }) : t('sendAnother')}
      </Button>
      {message ? <p className='text-sm text-white/60' role='status'>{message}</p> : null}
    </div>
  );
}
