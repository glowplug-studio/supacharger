'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';

import { showActionToast } from '@/supacharger/components/notifications/action-toast';
import { Button } from '@/supacharger/components/primitives/button';
import { Label } from '@/supacharger/components/primitives/label';

import type { PreferenceKind, PreferenceSurface } from './preference-contract';

export function PreferenceForm({ kind, surface }: { kind: PreferenceKind; surface: PreferenceSurface }) {
  const t = useTranslations('AccountPreferences');
  const initialValues = useMemo(
    () => Object.fromEntries(surface.options.map((option) => [option.id, option.value])),
    [surface.options],
  );
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
    const result = (await response.json()) as { ok: boolean; error?: string };
    if (result.ok) setSavedValues({ ...values });
    const text = result.ok ? t('saved') : t(`errors.${result.error ?? 'saveFailed'}`);
    setNotice({ error: !result.ok, text });
    showActionToast(result.ok ? 'success' : 'error', text);
    setPending(false);
  }

  return (
    <section className='sc-account-section sc-account-preferences' data-sc-account-preferences={kind}>
      <h2 className='sc-account-section-title'>{surface.title}</h2>
      <p className='sc-account-section-description'>{surface.description}</p>
      {surface.availability === 'disabled' ? (
        <p className='sc-account-unavailable' role='status'>
          {surface.disabledMessage ?? t('unavailable')}
        </p>
      ) : (
        <form className='sc-account-preference-form' onSubmit={submit}>
          {surface.options.length === 0 ? <p className='sc-account-empty'>{t('empty')}</p> : null}
          {surface.options.map((option) => {
            const inputId = `${kind}-${option.id}`;
            return (
              <div className='sc-account-preference-option' key={option.id}>
                <div className='sc-account-preference-copy'>
                  <Label className='sc-account-preference-label' htmlFor={inputId}>
                    {option.label}
                  </Label>
                  <p className='sc-account-preference-description'>{option.description}</p>
                </div>
                <input
                  checked={values[option.id] ?? false}
                  className='sc-account-preference-checkbox'
                  disabled={pending || option.disabled}
                  id={inputId}
                  onChange={(event) => setValues((current) => ({ ...current, [option.id]: event.target.checked }))}
                  type='checkbox'
                />
              </div>
            );
          })}
          {notice ? (
            <p
              className='sc-account-status'
              data-kind={notice.error ? 'error' : 'success'}
              role={notice.error ? 'alert' : 'status'}
            >
              {notice.text}
            </p>
          ) : null}
          <Button disabled={pending || !changed || surface.options.length === 0} type='submit'>
            {pending ? t('saving') : t('save')}
          </Button>
        </form>
      )}
    </section>
  );
}
