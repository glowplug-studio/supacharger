'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { FormProvider, useForm, useFormContext } from 'react-hook-form';

import { createClient } from '@/lib/supabase/client';
import { OrganisationProfileFields } from '@/supacharger.adapters/organisations/profile-fields';
import { showActionToast } from '@/supacharger/components/notifications/action-toast';
import { Button } from '@/supacharger/components/primitives/button';
import { Input } from '@/supacharger/components/primitives/input';
import { Label } from '@/supacharger/components/primitives/label';
import { Textarea } from '@/supacharger/components/primitives/textarea';
import { SC_CONFIG } from '@/supacharger/supacharger-config';

import type { OrganisationDetails, OrganisationMutationResponse } from './organisation-contract';

type OrganisationProfileValues = {
  accessPolicy: 'closed' | 'request';
  avatarPath: string | null;
  bio: string;
  colourHex: string;
  extension: Record<string, unknown>;
  handle: string;
  headerImagePath: string | null;
  name: string;
};

export function OrganisationProfileForm({
  avatarUrl,
  extension,
  headerImageUrl,
  organisation,
}: {
  avatarUrl: string | null;
  extension: Record<string, unknown>;
  headerImageUrl: string | null;
  organisation: OrganisationDetails;
}) {
  const router = useRouter();
  const t = useTranslations('Organisations');
  const canManage = organisation.role === 'owner' || organisation.role === 'admin';
  const methods = useForm<OrganisationProfileValues>({
    defaultValues: {
      accessPolicy: organisation.access_policy,
      avatarPath: organisation.avatar_path,
      bio: organisation.bio ?? '',
      colourHex: organisation.colour_hex,
      extension,
      handle: organisation.handle,
      headerImagePath: organisation.header_image_path,
      name: organisation.name,
    },
  });
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ kind: 'error' | 'success'; text: string } | null>(null);

  const submit = methods.handleSubmit(async (values) => {
    setIsSaving(true);
    setMessage(null);
    const response = await fetch('/api/organisations', {
      body: JSON.stringify({ action: 'update', organisationId: organisation.id, ...values }),
      headers: { 'Content-Type': 'application/json' },
      method: 'POST',
    });
    const result = (await response.json()) as OrganisationMutationResponse;
    if (!result.ok) {
      for (const [field, fieldMessage] of Object.entries(result.fieldErrors ?? {})) {
        methods.setError(field as keyof OrganisationProfileValues, { message: fieldMessage });
      }
      setMessage({ kind: 'error', text: result.message });
      showActionToast('error', result.message);
      setIsSaving(false);
      return;
    }
    methods.reset(values);
    const successMessage = t('profile.saved');
    setMessage({ kind: 'success', text: successMessage });
    showActionToast('success', successMessage);
    setIsSaving(false);
    const nextHandle = String(result.organisation.handle || values.handle);
    if (nextHandle !== organisation.handle) router.replace(`/${encodeURIComponent(nextHandle)}/settings`);
    router.refresh();
  });

  if (!canManage) {
    return (
      <section className='sc-organisation-panel sc-organisation-profile-readonly'>
        <h2 className='sc-organisation-section-title'>{t('profile.title')}</h2>
        <p className='sc-organisation-section-description'>{t('profile.memberReadOnly')}</p>
        <dl className='sc-organisation-details-list'>
          <div className='sc-organisation-details-item'>
            <dt className='sc-organisation-details-term'>{t('profile.name')}</dt>
            <dd className='sc-organisation-details-value'>{organisation.name}</dd>
          </div>
          <div className='sc-organisation-details-item'>
            <dt className='sc-organisation-details-term'>{t('profile.handle')}</dt>
            <dd className='sc-organisation-details-value'>/{organisation.handle}</dd>
          </div>
          <div className='sc-organisation-details-item' data-wide='true'>
            <dt className='sc-organisation-details-term'>{t('profile.bio')}</dt>
            <dd className='sc-organisation-details-value'>{organisation.bio || t('profile.noBio')}</dd>
          </div>
        </dl>
      </section>
    );
  }

  return (
    <FormProvider {...methods}>
      <form className='sc-organisation-profile-form' onSubmit={submit} data-sc-organisation-profile-form>
        <section className='sc-organisation-panel'>
          <div className='sc-organisation-section-header'>
            <h2 className='sc-organisation-section-title'>{t('profile.title')}</h2>
            <p className='sc-organisation-section-description'>{t('profile.description')}</p>
          </div>
          <div className='sc-organisation-fields'>
            <div className='sc-organisation-field-grid'>
              <OrganisationField field='name' label={t('profile.name')} maxLength={100} />
              <OrganisationField field='handle' label={t('profile.handle')} maxLength={64} />
            </div>
            <div className='sc-organisation-field'>
              <Label htmlFor='organisation-bio'>{t('profile.bio')}</Label>
              <Textarea id='organisation-bio' maxLength={300} rows={4} {...methods.register('bio')} />
              <p className='sc-organisation-field-help'>{t('profile.bioHelp')}</p>
            </div>
            <div className='sc-organisation-field-grid'>
              <div className='sc-organisation-field'>
                <Label htmlFor='organisation-colour'>{t('profile.colour')}</Label>
                <div className='sc-organisation-colour-control'>
                  <Input
                    className='sc-organisation-colour-picker'
                    id='organisation-colour-picker'
                    type='color'
                    {...methods.register('colourHex')}
                  />
                  <Input
                    id='organisation-colour'
                    maxLength={7}
                    pattern='#[0-9a-fA-F]{6}'
                    {...methods.register('colourHex')}
                  />
                </div>
              </div>
              <div className='sc-organisation-field'>
                <Label htmlFor='organisation-access-policy'>{t('profile.accessPolicy')}</Label>
                <select
                  className='sc-organisation-select'
                  id='organisation-access-policy'
                  {...methods.register('accessPolicy')}
                >
                  <option value='closed'>{t('profile.accessClosed')}</option>
                  <option value='request'>{t('profile.accessRequest')}</option>
                </select>
              </div>
            </div>
            <OrganisationProfileFields />
          </div>
        </section>

        {SC_CONFIG.ORGANISATIONS.PROFILE_MEDIA ? (
          <section className='sc-organisation-panel sc-organisation-media-grid'>
            <OrganisationMediaField initialUrl={avatarUrl} kind='avatar' organisationId={organisation.id} />
            <OrganisationMediaField initialUrl={headerImageUrl} kind='header' organisationId={organisation.id} />
          </section>
        ) : null}

        {message ? (
          <p
            className='sc-organisation-status'
            data-kind={message.kind}
            role={message.kind === 'error' ? 'alert' : 'status'}
          >
            {message.text}
          </p>
        ) : null}
        <Button disabled={isSaving || !methods.formState.isDirty} type='submit'>
          {isSaving ? t('common.saving') : t('common.save')}
        </Button>
      </form>
    </FormProvider>
  );
}

function OrganisationField({
  field,
  label,
  maxLength,
}: {
  field: 'handle' | 'name';
  label: string;
  maxLength: number;
}) {
  const { formState, register } = useFormContext<OrganisationProfileValues>();
  return (
    <div className='sc-organisation-field'>
      <Label htmlFor={`organisation-${field}`}>{label}</Label>
      <Input
        autoCapitalize={field === 'handle' ? 'none' : undefined}
        id={`organisation-${field}`}
        maxLength={maxLength}
        required
        {...register(field)}
      />
      {formState.errors[field]?.message ? (
        <p className='sc-organisation-status' data-kind='error' role='alert'>
          {formState.errors[field]?.message}
        </p>
      ) : null}
    </div>
  );
}

function OrganisationMediaField({
  initialUrl,
  kind,
  organisationId,
}: {
  initialUrl: string | null;
  kind: 'avatar' | 'header';
  organisationId: string;
}) {
  const t = useTranslations('Organisations');
  const methods = useFormContext<OrganisationProfileValues>();
  const [preview, setPreview] = useState(initialUrl);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const field = kind === 'avatar' ? 'avatarPath' : 'headerImagePath';

  async function upload(file: File) {
    setError(null);
    if (file.size > 5 * 1024 * 1024 || !['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) {
      const message = t('profile.mediaInvalid');
      setError(message);
      showActionToast('error', message);
      return;
    }
    setUploading(true);
    const extension =
      file.name
        .split('.')
        .pop()
        ?.toLowerCase()
        .replace(/[^a-z0-9]/g, '') || 'image';
    const folder = kind === 'avatar' ? 'logos' : 'headers';
    const path = `${organisationId}/${folder}/${crypto.randomUUID()}.${extension}`;
    const supabase = createClient();
    const { error: uploadError } = await supabase.storage
      .from('organisation-logos')
      .upload(path, file, { upsert: false });
    if (uploadError) {
      const message = t('profile.mediaUploadFailed');
      setError(message);
      showActionToast('error', message);
      setUploading(false);
      return;
    }
    const { data } = await supabase.storage.from('organisation-logos').createSignedUrl(path, 600);
    methods.setValue(field, path, { shouldDirty: true });
    setPreview(data?.signedUrl ?? URL.createObjectURL(file));
    setUploading(false);
  }

  return (
    <div className='sc-organisation-media-field' data-kind={kind}>
      <div className='sc-organisation-media-header'>
        <h3 className='sc-organisation-media-title'>{t(`profile.${kind}Title`)}</h3>
        <p className='sc-organisation-media-help'>{t('profile.mediaHelp')}</p>
      </div>
      <div className='sc-organisation-media-preview' data-kind={kind}>
        {preview ? <img alt='' className='sc-organisation-media-image' src={preview} /> : null}
      </div>
      <Input
        accept='image/jpeg,image/png,image/webp,image/gif'
        aria-label={t(`profile.${kind}Upload`)}
        disabled={uploading}
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void upload(file);
        }}
        type='file'
      />
      {methods.watch(field) ? (
        <Button
          onClick={() => {
            methods.setValue(field, null, { shouldDirty: true });
            setPreview(null);
          }}
          size='sm'
          type='button'
          variant='outline'
        >
          {t('profile.removeMedia')}
        </Button>
      ) : null}
      {error ? (
        <p className='sc-organisation-status' data-kind='error' role='alert'>
          {error}
        </p>
      ) : null}
    </div>
  );
}
