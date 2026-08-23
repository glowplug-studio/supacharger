'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { FormProvider, useForm } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SUPPORTED_LOCALES } from '@/i18n/config';
import { AccountProfileFields } from '@/supacharger.adapters/account/profile-fields';
import { publishAccountSummaryChanged } from '@/supacharger/account/account-summary-events';
import { SC_CONFIG } from '@/supacharger/supacharger-config';

import { AccountMediaField } from './account-media-field';
import type { AccountDetailsFormValues, AccountDetailsResponse } from './account-settings-contract';

type AccountDetailsFormProps = {
  avatarPath: string | null;
  avatarUrl: string | null;
  email: string;
  extension: Record<string, unknown>;
  firstName: string;
  headerImagePath: string | null;
  headerImageUrl: string | null;
  language: string;
  lastName: string;
  username: string;
};

export function AccountDetailsForm(props: AccountDetailsFormProps) {
  const router = useRouter();
  const t = useTranslations('AccountSettings');
  const methods = useForm<AccountDetailsFormValues>({
    defaultValues: {
      firstName: props.firstName,
      lastName: props.lastName,
      username: props.username,
      language: props.language,
      extension: props.extension,
    },
  });
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ kind: 'error' | 'success'; text: string } | null>(null);

  const submit = methods.handleSubmit(async (values) => {
    setIsSaving(true);
    setMessage(null);
    const response = await fetch('/api/account/details', {
      body: JSON.stringify(values),
      headers: { 'Content-Type': 'application/json' },
      method: 'POST',
    });
    const result = (await response.json()) as AccountDetailsResponse;
    if (!result.ok) {
      for (const [field, fieldMessage] of Object.entries(result.fieldErrors ?? {})) {
        methods.setError(field as keyof AccountDetailsFormValues, { message: fieldMessage });
      }
      setMessage({ kind: 'error', text: result.message });
      setIsSaving(false);
      return;
    }

    methods.reset(values);
    setMessage({ kind: 'success', text: t('details.saved') });
    setIsSaving(false);
    publishAccountSummaryChanged(result.summary);
    router.refresh();
  });

  const errorFor = (field: 'firstName' | 'lastName' | 'username' | 'language') => methods.formState.errors[field]?.message;

  return (
    <div className='space-y-6' data-sc-account-details>
      <section className='border-border bg-card rounded-xl border p-5 shadow-sm sm:p-6'>
        <div className='mb-6 space-y-1'>
          <h2 className='text-xl font-semibold'>{t('details.title')}</h2>
          <p className='text-muted-foreground text-sm'>{t('details.description')}</p>
        </div>
        <FormProvider {...methods}>
          <form className='space-y-5' onSubmit={submit}>
            <div className='grid gap-4 sm:grid-cols-2'>
              <div className='space-y-2'>
                <Label htmlFor='account-first-name'>{t('details.firstName')}</Label>
                <Input autoComplete='given-name' id='account-first-name' maxLength={100} {...methods.register('firstName')} />
                {errorFor('firstName') ? <p className='text-destructive text-sm' role='alert'>{errorFor('firstName')}</p> : null}
              </div>
              <div className='space-y-2'>
                <Label htmlFor='account-last-name'>{t('details.lastName')}</Label>
                <Input autoComplete='family-name' id='account-last-name' maxLength={100} {...methods.register('lastName')} />
                {errorFor('lastName') ? <p className='text-destructive text-sm' role='alert'>{errorFor('lastName')}</p> : null}
              </div>
            </div>
            <div className='space-y-2'>
              <Label htmlFor='account-email'>{t('details.email')}</Label>
              <Input disabled id='account-email' type='email' value={props.email} />
              <p className='text-muted-foreground text-sm'>{t('details.emailHelp')}</p>
            </div>
            {SC_CONFIG.PROFILE_IDENTITY.USERNAME !== 'disabled' ? (
              <div className='space-y-2'>
                <Label htmlFor='account-username'>{t('details.username')}</Label>
                <Input
                  autoComplete='username'
                  id='account-username'
                  maxLength={40}
                  required={SC_CONFIG.PROFILE_IDENTITY.USERNAME === 'required'}
                  {...methods.register('username')}
                />
                <p className='text-muted-foreground text-sm'>{t('details.usernameHelp')}</p>
                {errorFor('username') ? <p className='text-destructive text-sm' role='alert'>{errorFor('username')}</p> : null}
              </div>
            ) : null}
            {SC_CONFIG.ACCOUNT_SETTINGS.LANGUAGE ? (
              <div className='space-y-2'>
                <Label htmlFor='account-language'>{t('details.language')}</Label>
                <select
                  className='border-input bg-background ring-offset-background focus-visible:ring-ring min-h-10 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:outline-none'
                  id='account-language'
                  {...methods.register('language')}
                >
                  {SUPPORTED_LOCALES.map((locale) => <option key={locale} value={locale}>{t(`languages.${locale}`)}</option>)}
                </select>
                {errorFor('language') ? <p className='text-destructive text-sm' role='alert'>{errorFor('language')}</p> : null}
              </div>
            ) : null}
            <AccountProfileFields />
            {message ? (
              <p className={message.kind === 'error' ? 'text-destructive text-sm' : 'text-sm text-emerald-600'} role={message.kind === 'error' ? 'alert' : 'status'}>
                {message.text}
              </p>
            ) : null}
            <Button disabled={isSaving || !methods.formState.isDirty} type='submit'>
              {isSaving ? t('details.saving') : t('details.save')}
            </Button>
          </form>
        </FormProvider>
      </section>

      {SC_CONFIG.PROFILE_IDENTITY.AVATAR !== 'disabled' ? (
        <section className='border-border bg-card rounded-xl border p-5 shadow-sm sm:p-6'>
          <AccountMediaField initialPath={props.avatarPath} initialUrl={props.avatarUrl} kind='avatar' />
        </section>
      ) : null}
      {SC_CONFIG.PROFILE_IDENTITY.HEADER_IMAGE !== 'disabled' ? (
        <section className='border-border bg-card rounded-xl border p-5 shadow-sm sm:p-6'>
          <AccountMediaField initialPath={props.headerImagePath} initialUrl={props.headerImageUrl} kind='header' />
        </section>
      ) : null}

      {SC_CONFIG.ACCOUNT_SETTINGS.PRODUCT_PROFILE_PATH ? (
        <section className='border-border bg-card rounded-xl border p-5 shadow-sm sm:p-6'>
          <h2 className='font-semibold'>{t('productProfile.title')}</h2>
          <p className='text-muted-foreground mt-1 text-sm'>{t('productProfile.description')}</p>
          <Button asChild className='mt-4' variant='outline'><Link href={SC_CONFIG.ACCOUNT_SETTINGS.PRODUCT_PROFILE_PATH}>{t('productProfile.open')}</Link></Button>
        </section>
      ) : null}

      {SC_CONFIG.ACCOUNT_SETTINGS.CANCEL_ACCOUNT !== 'hidden' ? (
        <section className='border-destructive/40 bg-card rounded-xl border p-5 sm:p-6' data-sc-account-cancellation>
          <h2 className='font-semibold'>{t('cancellation.title')}</h2>
          <p className='text-muted-foreground mt-1 text-sm'>{t('cancellation.description')}</p>
          <Button className='mt-4' disabled={SC_CONFIG.ACCOUNT_SETTINGS.CANCEL_ACCOUNT !== 'enabled'} variant='destructive'>
            {SC_CONFIG.ACCOUNT_SETTINGS.CANCEL_ACCOUNT === 'disabled' ? t('cancellation.planned') : t('cancellation.action')}
          </Button>
        </section>
      ) : null}
    </div>
  );
}
