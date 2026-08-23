'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { FormProvider, useForm, useFormContext } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { createClient } from '@/lib/supabase/client';
import { OrganisationProfileFields } from '@/supacharger.adapters/organisations/profile-fields';
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
    const result = await response.json() as OrganisationMutationResponse;
    if (!result.ok) {
      for (const [field, fieldMessage] of Object.entries(result.fieldErrors ?? {})) {
        methods.setError(field as keyof OrganisationProfileValues, { message: fieldMessage });
      }
      setMessage({ kind: 'error', text: result.message });
      setIsSaving(false);
      return;
    }
    methods.reset(values);
    setMessage({ kind: 'success', text: t('profile.saved') });
    setIsSaving(false);
    const nextHandle = String(result.organisation.handle || values.handle);
    if (nextHandle !== organisation.handle) router.replace(`/${encodeURIComponent(nextHandle)}/settings`);
    router.refresh();
  });

  if (!canManage) {
    return (
      <section className='border-border bg-card rounded-xl border p-5 shadow-sm sm:p-6'>
        <h2 className='text-xl font-semibold'>{t('profile.title')}</h2>
        <p className='text-muted-foreground mt-1 text-sm'>{t('profile.memberReadOnly')}</p>
        <dl className='mt-5 grid gap-4 sm:grid-cols-2'>
          <div><dt className='text-muted-foreground text-xs'>{t('profile.name')}</dt><dd className='font-medium'>{organisation.name}</dd></div>
          <div><dt className='text-muted-foreground text-xs'>{t('profile.handle')}</dt><dd className='font-medium'>/{organisation.handle}</dd></div>
          <div className='sm:col-span-2'><dt className='text-muted-foreground text-xs'>{t('profile.bio')}</dt><dd>{organisation.bio || t('profile.noBio')}</dd></div>
        </dl>
      </section>
    );
  }

  return (
    <FormProvider {...methods}>
      <form className='space-y-6' onSubmit={submit} data-sc-organisation-profile-form>
        <section className='border-border bg-card rounded-xl border p-5 shadow-sm sm:p-6'>
          <div className='mb-6'>
            <h2 className='text-xl font-semibold'>{t('profile.title')}</h2>
            <p className='text-muted-foreground mt-1 text-sm'>{t('profile.description')}</p>
          </div>
          <div className='space-y-5'>
            <div className='grid gap-4 sm:grid-cols-2'>
              <OrganisationField field='name' label={t('profile.name')} maxLength={100} />
              <OrganisationField field='handle' label={t('profile.handle')} maxLength={64} />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='organisation-bio'>{t('profile.bio')}</Label>
              <Textarea id='organisation-bio' maxLength={300} rows={4} {...methods.register('bio')} />
              <p className='text-muted-foreground text-xs'>{t('profile.bioHelp')}</p>
            </div>
            <div className='grid gap-4 sm:grid-cols-2'>
              <div className='space-y-2'>
                <Label htmlFor='organisation-colour'>{t('profile.colour')}</Label>
                <div className='flex gap-2'>
                  <Input className='w-14 shrink-0 p-1' id='organisation-colour-picker' type='color' {...methods.register('colourHex')} />
                  <Input id='organisation-colour' maxLength={7} pattern='#[0-9a-fA-F]{6}' {...methods.register('colourHex')} />
                </div>
              </div>
              <div className='space-y-2'>
                <Label htmlFor='organisation-access-policy'>{t('profile.accessPolicy')}</Label>
                <select className='border-input bg-background min-h-10 w-full rounded-md border px-3 py-2 text-sm' id='organisation-access-policy' {...methods.register('accessPolicy')}>
                  <option value='closed'>{t('profile.accessClosed')}</option>
                  <option value='request'>{t('profile.accessRequest')}</option>
                </select>
              </div>
            </div>
            <OrganisationProfileFields />
          </div>
        </section>

        {SC_CONFIG.ORGANISATIONS.PROFILE_MEDIA ? (
          <section className='border-border bg-card grid gap-6 rounded-xl border p-5 shadow-sm sm:grid-cols-2 sm:p-6'>
            <OrganisationMediaField initialUrl={avatarUrl} kind='avatar' organisationId={organisation.id} />
            <OrganisationMediaField initialUrl={headerImageUrl} kind='header' organisationId={organisation.id} />
          </section>
        ) : null}

        {message ? <p className={message.kind === 'error' ? 'text-destructive text-sm' : 'text-sm text-emerald-600'} role={message.kind === 'error' ? 'alert' : 'status'}>{message.text}</p> : null}
        <Button disabled={isSaving || !methods.formState.isDirty} type='submit'>{isSaving ? t('common.saving') : t('common.save')}</Button>
      </form>
    </FormProvider>
  );
}

function OrganisationField({ field, label, maxLength }: { field: 'handle' | 'name'; label: string; maxLength: number }) {
  const { formState, register } = useFormContext<OrganisationProfileValues>();
  return (
    <div className='space-y-2'>
      <Label htmlFor={`organisation-${field}`}>{label}</Label>
      <Input autoCapitalize={field === 'handle' ? 'none' : undefined} id={`organisation-${field}`} maxLength={maxLength} required {...register(field)} />
      {formState.errors[field]?.message ? <p className='text-destructive text-sm' role='alert'>{formState.errors[field]?.message}</p> : null}
    </div>
  );
}

function OrganisationMediaField({ initialUrl, kind, organisationId }: {
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
      setError(t('profile.mediaInvalid'));
      return;
    }
    setUploading(true);
    const extension = file.name.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'image';
    const folder = kind === 'avatar' ? 'logos' : 'headers';
    const path = `${organisationId}/${folder}/${crypto.randomUUID()}.${extension}`;
    const supabase = createClient();
    const { error: uploadError } = await supabase.storage.from('organisation-logos').upload(path, file, { upsert: false });
    if (uploadError) {
      setError(t('profile.mediaUploadFailed'));
      setUploading(false);
      return;
    }
    const { data } = await supabase.storage.from('organisation-logos').createSignedUrl(path, 600);
    methods.setValue(field, path, { shouldDirty: true });
    setPreview(data?.signedUrl ?? URL.createObjectURL(file));
    setUploading(false);
  }

  return (
    <div className='space-y-3'>
      <div>
        <h3 className='font-medium'>{t(`profile.${kind}Title`)}</h3>
        <p className='text-muted-foreground text-xs'>{t('profile.mediaHelp')}</p>
      </div>
      <div className={kind === 'avatar' ? 'bg-muted size-20 overflow-hidden rounded-xl' : 'bg-muted aspect-[8/3] w-full overflow-hidden rounded-xl'}>
        {preview ? <img alt='' className='size-full object-cover' src={preview} /> : null}
      </div>
      <Input accept='image/jpeg,image/png,image/webp,image/gif' aria-label={t(`profile.${kind}Upload`)} disabled={uploading} onChange={(event) => { const file = event.target.files?.[0]; if (file) void upload(file); }} type='file' />
      {methods.watch(field) ? <Button onClick={() => { methods.setValue(field, null, { shouldDirty: true }); setPreview(null); }} size='sm' type='button' variant='outline'>{t('profile.removeMedia')}</Button> : null}
      {error ? <p className='text-destructive text-sm' role='alert'>{error}</p> : null}
    </div>
  );
}
