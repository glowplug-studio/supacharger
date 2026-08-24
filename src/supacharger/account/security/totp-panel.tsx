'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';

import { createClient } from '@/lib/supabase/client';
import { Button } from '@/supacharger/components/primitives/button';
import { Input } from '@/supacharger/components/primitives/input';
import { Label } from '@/supacharger/components/primitives/label';
import { SC_CONFIG } from '@/supacharger/supacharger-config';

type TotpFactor = {
  created_at: string;
  factor_type: 'totp';
  friendly_name?: string;
  id: string;
  status: 'unverified' | 'verified';
};

type Enrollment = { factorId: string; qrCode: string; secret: string };
type Notice = { kind: 'error' | 'success'; text: string } | null;

function qrSource(svg: string) {
  return svg.startsWith('data:') ? svg : `data:image/svg+xml;utf-8,${encodeURIComponent(svg)}`;
}

export function TotpPanel() {
  const t = useTranslations('AccountSecurity.mfa');
  const [factors, setFactors] = useState<TotpFactor[]>([]);
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [enrollmentCode, setEnrollmentCode] = useState('');
  const [removalCodes, setRemovalCodes] = useState<Record<string, string>>({});
  const [pending, setPending] = useState<string | null>('load');
  const [notice, setNotice] = useState<Notice>(null);
  const verifiedFactors = useMemo(() => factors.filter((factor) => factor.status === 'verified'), [factors]);

  const loadFactors = useCallback(async () => {
    setPending('load');
    const { data, error } = await createClient().auth.mfa.listFactors();
    if (error) setNotice({ kind: 'error', text: t('errors.load') });
    else setFactors((data?.totp ?? []) as TotpFactor[]);
    setPending(null);
  }, [t]);

  useEffect(() => {
    const timeout = window.setTimeout(() => void loadFactors(), 0);
    return () => window.clearTimeout(timeout);
  }, [loadFactors]);

  async function startEnrollment() {
    setPending('enroll');
    setNotice(null);
    const { data, error } = await createClient().auth.mfa.enroll({
      factorType: 'totp',
      friendlyName: t('authenticator'),
      issuer: SC_CONFIG.SITE_TITLE,
    });
    if (error || !data?.totp) setNotice({ kind: 'error', text: t('errors.enroll') });
    else setEnrollment({ factorId: data.id, qrCode: data.totp.qr_code, secret: data.totp.secret });
    setPending(null);
  }

  async function cancelEnrollment() {
    if (!enrollment) return;
    setPending(enrollment.factorId);
    const { error } = await createClient().auth.mfa.unenroll({ factorId: enrollment.factorId });
    if (error) setNotice({ kind: 'error', text: t('errors.cancel') });
    else {
      setEnrollment(null);
      setEnrollmentCode('');
      setNotice({ kind: 'success', text: t('cancelled') });
      await loadFactors();
    }
    setPending(null);
  }

  async function verifyEnrollment() {
    if (!enrollment || !/^\d{6}$/.test(enrollmentCode)) {
      setNotice({ kind: 'error', text: t('errors.code') });
      return;
    }
    setPending(enrollment.factorId);
    const { error } = await createClient().auth.mfa.challengeAndVerify({ factorId: enrollment.factorId, code: enrollmentCode });
    if (error) setNotice({ kind: 'error', text: t('errors.verify') });
    else {
      setEnrollment(null);
      setEnrollmentCode('');
      setNotice({ kind: 'success', text: t('enabled') });
      await loadFactors();
    }
    setPending(null);
  }

  async function removeFactor(factorId: string) {
    const code = removalCodes[factorId] ?? '';
    if (!/^\d{6}$/.test(code)) {
      setNotice({ kind: 'error', text: t('errors.code') });
      return;
    }
    setPending(factorId);
    const supabase = createClient();
    const assurance = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (assurance.error) {
      setNotice({ kind: 'error', text: t('errors.remove') });
      setPending(null);
      return;
    }
    if (assurance.data.nextLevel === 'aal2' && assurance.data.currentLevel !== 'aal2') {
      const challenge = await supabase.auth.mfa.challengeAndVerify({ factorId, code });
      if (challenge.error) {
        setNotice({ kind: 'error', text: t('errors.verify') });
        setPending(null);
        return;
      }
    }
    const { error } = await supabase.auth.mfa.unenroll({ factorId });
    if (error) setNotice({ kind: 'error', text: t('errors.remove') });
    else {
      setRemovalCodes((values) => ({ ...values, [factorId]: '' }));
      setNotice({ kind: 'success', text: t('removed') });
      await loadFactors();
    }
    setPending(null);
  }

  return (
    <section className='border-border bg-card rounded-xl border p-5 shadow-sm sm:p-6' data-sc-account-mfa>
      <div className='flex flex-wrap items-start justify-between gap-4'>
        <div>
          <h2 className='text-xl font-semibold'>{t('title')}</h2>
          <p className='text-muted-foreground mt-1 text-sm'>{t('description')}</p>
        </div>
        {!enrollment ? <Button disabled={pending !== null} onClick={() => void startEnrollment()} type='button' variant='outline'>{t('setup')}</Button> : null}
      </div>
      {notice ? <p className={notice.kind === 'error' ? 'text-destructive mt-4 text-sm' : 'mt-4 text-sm text-emerald-600'} role={notice.kind === 'error' ? 'alert' : 'status'}>{notice.text}</p> : null}

      {enrollment ? (
        <div className='mt-5 grid gap-5 md:grid-cols-[200px_minmax(0,1fr)]'>
          <div className='flex size-[200px] items-center justify-center rounded-lg bg-white p-3'>
            {/* Supabase returns the QR code as inline SVG data. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img alt={t('qrAlt')} className='size-full' src={qrSource(enrollment.qrCode)} />
          </div>
          <div className='space-y-4'>
            <div className='space-y-2'>
              <Label>{t('manualKey')}</Label>
              <code className='bg-muted block rounded-md p-3 text-sm break-all'>{enrollment.secret}</code>
            </div>
            <div className='space-y-2'>
              <Label htmlFor='mfa-enrollment-code'>{t('code')}</Label>
              <Input autoComplete='one-time-code' id='mfa-enrollment-code' inputMode='numeric' maxLength={6} onChange={(event) => setEnrollmentCode(event.target.value.replace(/\D/g, '').slice(0, 6))} value={enrollmentCode} />
            </div>
            <div className='flex flex-wrap gap-3'>
              <Button disabled={pending !== null} onClick={() => void verifyEnrollment()} type='button'>{t('enable')}</Button>
              <Button disabled={pending !== null} onClick={() => void cancelEnrollment()} type='button' variant='ghost'>{t('cancel')}</Button>
            </div>
          </div>
        </div>
      ) : null}

      <div className='mt-5 space-y-3'>
        {pending === 'load' ? <p className='text-muted-foreground text-sm' role='status'>{t('loading')}</p> : null}
        {verifiedFactors.length === 0 && pending !== 'load' ? <p className='text-muted-foreground text-sm'>{t('empty')}</p> : null}
        {verifiedFactors.map((factor) => (
          <div className='bg-muted/50 rounded-lg p-4' key={factor.id}>
            <p className='font-medium'>{factor.friendly_name || t('authenticator')}</p>
            <p className='text-muted-foreground mt-1 text-sm'>{t('added', { date: new Date(factor.created_at).toLocaleDateString() })}</p>
            <div className='mt-3 flex flex-wrap items-end gap-3'>
              <div className='min-w-48 flex-1 space-y-2'>
                <Label htmlFor={`mfa-remove-${factor.id}`}>{t('removeCode')}</Label>
                <Input id={`mfa-remove-${factor.id}`} inputMode='numeric' maxLength={6} onChange={(event) => setRemovalCodes((values) => ({ ...values, [factor.id]: event.target.value.replace(/\D/g, '').slice(0, 6) }))} value={removalCodes[factor.id] ?? ''} />
              </div>
              <Button disabled={pending !== null} onClick={() => void removeFactor(factor.id)} type='button' variant='destructive'>{t('remove')}</Button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
