'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';

import { showActionToast } from '@/supacharger/components/notifications/action-toast';
import { Button } from '@/supacharger/components/primitives/button';
import { Label } from '@/supacharger/components/primitives/label';

import type { PreferenceKind, PreferenceSurface } from './preference-contract';

export function PreferenceForm({ kind, surface }: { kind: PreferenceKind; surface: PreferenceSurface }) {
  const t = useTranslations('AccountPreferences');
  const initialValues = useMemo(() => Object.fromEntries(surface.options.map((option) => [option.id, option.value])), [surface.options]);
  const [values, setValues] = useState<Record<string, boolean>>(initialValues);
  const [savedValues, setSavedValues] = useState<Record<string, boolean>>(initialValues);
  const [pending, setPending] = useState(false);
  const [notice, setNotice] = useState<{ error: boolean; text: string } | null>(null);
  const changed = surface.options.some((option) => values[option.id] !== savedValues[option.id]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setNotice(null);
    const response = await fetch(`/api/account/preferences/${kind}`, {
      body: JSON.stringify({ values }),
      headers: { 'Content-Type': 'application/json' },
      method: 'POST',
    });
    const result = await response.json() as { ok: boolean; error?: string };
    if (result.ok) setSavedValues({ ...values });
    const text = result.ok ? t('saved') : t(`errors.${result.error ?? 'saveFailed'}`);
    setNotice({ error: !result.ok, text });
    showActionToast(result.ok ? 'success' : 'error', text);
    setPending(false);
  }

  return (
    <section className='border-border bg-card rounded-xl border p-5 shadow-sm sm:p-6' data-sc-account-preferences={kind}>
      <h2 className='text-xl font-semibold'>{surface.title}</h2>
      <p className='text-muted-foreground mt-1 text-sm'>{surface.description}</p>
      {surface.availability === 'disabled' ? (
        <p className='bg-muted text-muted-foreground mt-5 rounded-lg px-4 py-3 text-sm' role='status'>{surface.disabledMessage ?? t('unavailable')}</p>
      ) : (
        <form className='mt-5 space-y-5' onSubmit={submit}>
          {surface.options.length === 0 ? <p className='text-muted-foreground text-sm'>{t('empty')}</p> : null}
          {surface.options.map((option) => {
            const inputId = `${kind}-${option.id}`;
            return (
              <div className='border-border flex items-start justify-between gap-4 border-b pb-5 last:border-b-0 last:pb-0' key={option.id}>
                <div>
                  <Label className='text-base' htmlFor={inputId}>{option.label}</Label>
                  <p className='text-muted-foreground mt-1 text-sm'>{option.description}</p>
                </div>
                <input
                  checked={values[option.id] ?? false}
                  className='accent-primary size-5 shrink-0 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50'
                  disabled={pending || option.disabled}
                  id={inputId}
                  onChange={(event) => setValues((current) => ({ ...current, [option.id]: event.target.checked }))}
                  type='checkbox'
                />
              </div>
            );
          })}
          {notice ? <p className={notice.error ? 'text-destructive text-sm' : 'text-sm text-emerald-600'} role={notice.error ? 'alert' : 'status'}>{notice.text}</p> : null}
          <Button disabled={pending || !changed || surface.options.length === 0} type='submit'>{pending ? t('saving') : t('save')}</Button>
        </form>
      )}
    </section>
  );
}
