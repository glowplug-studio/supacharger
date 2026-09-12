'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { FormProvider, useForm } from 'react-hook-form';

import { SUPPORTED_LOCALES } from '@/i18n/config';
import { AccountProfileFields } from '@/supacharger.adapters/account/profile-fields';
import { AccountProfileMedia } from '@/supacharger.adapters/account/profile-media';
import { publishAccountSummaryChanged } from '@/supacharger/account/account-summary-events';
import { showActionToast } from '@/supacharger/components/notifications/action-toast';
import { Button } from '@/supacharger/components/primitives/button';
import { Input } from '@/supacharger/components/primitives/input';
import { Label } from '@/supacharger/components/primitives/label';
import { SC_CONFIG } from '@/supacharger/supacharger-config';

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
      showActionToast('error', result.message);
      setIsSaving(false);
      return;
    }

    methods.reset(values);
    const successMessage = t('details.saved');
    setMessage({ kind: 'success', text: successMessage });
    showActionToast('success', successMessage);
    setIsSaving(false);
    publishAccountSummaryChanged(result.summary);
    router.refresh();
  });

  const errorFor = (field: 'firstName' | 'lastName' | 'username' | 'language') =>
    methods.formState.errors[field]?.message;

  return (
    <div className='sc-account-details' data-sc-account-details>
      <section className='sc-account-section'>
        <div className='sc-account-section-header'>
          <h2 className='sc-account-section-title'>{t('details.title')}</h2>
          <p className='sc-account-section-description'>{t('details.description')}</p>
        </div>
        <FormProvider {...methods}>
          <form className='sc-account-form' onSubmit={submit}>
            <div className='sc-account-field-grid'>
              <div className='sc-account-field'>
                <Label htmlFor='account-first-name'>{t('details.firstName')}</Label>
                <Input
                  autoComplete='given-name'
                  id='account-first-name'
                  maxLength={100}
                  {...methods.register('firstName')}
                />
                {errorFor('firstName') ? (
                  <p className='sc-account-status' data-kind='error' role='alert'>
                    {errorFor('firstName')}
                  </p>
                ) : null}
              </div>
              <div className='sc-account-field'>
                <Label htmlFor='account-last-name'>{t('details.lastName')}</Label>
                <Input
                  autoComplete='family-name'
                  id='account-last-name'
                  maxLength={100}
                  {...methods.register('lastName')}
                />
                {errorFor('lastName') ? (
                  <p className='sc-account-status' data-kind='error' role='alert'>
                    {errorFor('lastName')}
                  </p>
                ) : null}
              </div>
            </div>
            <div className='sc-account-field'>
              <Label htmlFor='account-email'>{t('details.email')}</Label>
              <Input disabled id='account-email' type='email' value={props.email} />
              <p className='sc-account-field-help'>{t('details.emailHelp')}</p>
            </div>
            {SC_CONFIG.PROFILE_IDENTITY.USERNAME !== 'disabled' ? (
              <div className='sc-account-field'>
                <Label htmlFor='account-username'>{t('details.username')}</Label>
                <Input
                  autoComplete='username'
                  id='account-username'
                  maxLength={40}
                  required={SC_CONFIG.PROFILE_IDENTITY.USERNAME === 'required'}
                  {...methods.register('username')}
                />
                <p className='sc-account-field-help'>{t('details.usernameHelp')}</p>
                {errorFor('username') ? (
                  <p className='sc-account-status' data-kind='error' role='alert'>
                    {errorFor('username')}
                  </p>
                ) : null}
              </div>
            ) : null}
            {SC_CONFIG.ACCOUNT_SETTINGS.LANGUAGE ? (
              <div className='sc-account-field'>
                <Label htmlFor='account-language'>{t('details.language')}</Label>
                <select className='sc-account-select' id='account-language' {...methods.register('language')}>
                  {SUPPORTED_LOCALES.map((locale) => (
                    <option key={locale} value={locale}>
                      {t(`languages.${locale}`)}
                    </option>
                  ))}
                </select>
                {errorFor('language') ? (
                  <p className='sc-account-status' data-kind='error' role='alert'>
                    {errorFor('language')}
                  </p>
                ) : null}
              </div>
            ) : null}
            <AccountProfileFields />
            {message ? (
              <p
                className='sc-account-status'
                data-kind={message.kind}
                role={message.kind === 'error' ? 'alert' : 'status'}
              >
                {message.text}
              </p>
            ) : null}
            <Button disabled={isSaving || !methods.formState.isDirty} type='submit'>
              {isSaving ? t('details.saving') : t('details.save')}
            </Button>
          </form>
        </FormProvider>
      </section>

      {SC_CONFIG.PROFILE_IDENTITY.AVATAR !== 'disabled' || SC_CONFIG.PROFILE_IDENTITY.HEADER_IMAGE !== 'disabled' ? (
        <section className='sc-account-section'>
          <AccountProfileMedia
            avatarEnabled={SC_CONFIG.PROFILE_IDENTITY.AVATAR !== 'disabled'}
            firstName={props.firstName}
            headerEnabled={SC_CONFIG.PROFILE_IDENTITY.HEADER_IMAGE !== 'disabled'}
            initialAvatarPath={props.avatarPath}
            initialAvatarUrl={props.avatarUrl}
            initialHeaderPath={props.headerImagePath}
            initialHeaderUrl={props.headerImageUrl}
            lastName={props.lastName}
            username={props.username}
          />
        </section>
      ) : null}

      {SC_CONFIG.ACCOUNT_SETTINGS.PRODUCT_PROFILE_PATH ? (
        <section className='sc-account-section'>
          <h2 className='sc-account-section-title'>{t('productProfile.title')}</h2>
          <p className='sc-account-section-description'>{t('productProfile.description')}</p>
          <Button asChild className='sc-account-section-action' variant='outline'>
            <Link href={SC_CONFIG.ACCOUNT_SETTINGS.PRODUCT_PROFILE_PATH}>{t('productProfile.open')}</Link>
          </Button>
        </section>
      ) : null}

      {SC_CONFIG.ACCOUNT_SETTINGS.CANCEL_ACCOUNT !== 'hidden' ? (
        <section className='sc-account-section sc-account-cancellation' data-sc-account-cancellation>
          <h2 className='sc-account-section-title'>{t('cancellation.title')}</h2>
          <p className='sc-account-section-description'>{t('cancellation.description')}</p>
          <Button
            className='sc-account-section-action'
            disabled={SC_CONFIG.ACCOUNT_SETTINGS.CANCEL_ACCOUNT !== 'enabled'}
            variant='destructive'
          >
            {SC_CONFIG.ACCOUNT_SETTINGS.CANCEL_ACCOUNT === 'disabled'
              ? t('cancellation.planned')
              : t('cancellation.action')}
          </Button>
        </section>
      ) : null}
    </div>
  );
}
