'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

import { createClient } from '@/lib/supabase/client';
import { getSafeNextPath } from '@/supacharger/auth/safe-next-path';
import { Button } from '@/supacharger/components/primitives/button';
import { Input } from '@/supacharger/components/primitives/input';
import { Label } from '@/supacharger/components/primitives/label';
import { SC_CONFIG } from '@/supacharger/supacharger-config';

export function MfaChallengeForm({ nextPath }: { nextPath: string | null }) {
  const router = useRouter();
  const t = useTranslations('AccountSecurity.mfaChallenge');
  const [factorId, setFactorId] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [pending, setPending] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const destination = getSafeNextPath(nextPath) ?? SC_CONFIG.USER_REDIRECTS.AUTHED_USER.LOGIN_REDIRECT_DESTINATION;

  useEffect(() => {
    async function prepare() {
      const supabase = createClient();
      const assurance = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if (assurance.error) {
        setError(t('errors.load'));
        setPending(false);
        return;
      }
      if (assurance.data.currentLevel === 'aal2' || assurance.data.nextLevel !== 'aal2') {
        router.replace(destination);
        router.refresh();
        return;
      }
      const factors = await supabase.auth.mfa.listFactors();
      const verified = factors.data?.totp?.find((factor) => factor.status === 'verified');
      if (factors.error || !verified) setError(t('errors.missing'));
      else setFactorId(verified.id);
      setPending(false);
    }
    void prepare();
  }, [destination, router, t]);

  async function verify(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!factorId || !/^\d{6}$/.test(code)) {
      setError(t('errors.code'));
      return;
    }
    setPending(true);
    setError(null);
    const { error: verifyError } = await createClient().auth.mfa.challengeAndVerify({ factorId, code });
    if (verifyError) {
      setError(t('errors.verify'));
      setPending(false);
      return;
    }
    router.replace(destination);
    router.refresh();
  }

  return (
    <form className='w-full max-w-md space-y-5 rounded-xl border bg-card p-6 shadow-sm' onSubmit={verify}>
      <div>
        <h1 className='text-2xl font-semibold'>{t('title')}</h1>
        <p className='text-muted-foreground mt-2 text-sm'>{t('description')}</p>
      </div>
      <div className='space-y-2'>
        <Label htmlFor='mfa-challenge-code'>{t('code')}</Label>
        <Input autoComplete='one-time-code' autoFocus id='mfa-challenge-code' inputMode='numeric' maxLength={6} onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))} value={code} />
      </div>
      {error ? <p className='text-destructive text-sm' role='alert'>{error}</p> : null}
      <Button className='w-full' disabled={pending || !factorId} type='submit'>{pending ? t('checking') : t('verify')}</Button>
    </form>
  );
}
