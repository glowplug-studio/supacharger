'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

import { createClient } from '@/lib/supabase/client';
import { publishAccountSummaryChanged } from '@/supacharger/account/account-summary-events';
import { showActionToast } from '@/supacharger/components/notifications/action-toast';
import { Button } from '@/supacharger/components/primitives/button';
import { Input } from '@/supacharger/components/primitives/input';

type UploadResponse = { error?: string; path?: string; signed_url?: string | null };

export function AccountMediaField({
  initialPath,
  initialUrl,
  kind,
}: {
  initialPath: string | null;
  initialUrl: string | null;
  kind: 'avatar' | 'header';
}) {
  const router = useRouter();
  const t = useTranslations('AccountSettings.media');
  const previewRef = useRef<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [path, setPath] = useState(initialPath);
  const [url, setUrl] = useState(initialUrl);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(
    () => () => {
      if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    },
    [],
  );

  function selectFile(nextFile: File | undefined) {
    setError(null);
    if (!nextFile) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(nextFile.type) || nextFile.size > 5 * 1024 * 1024) {
      const message = t('invalidFile');
      setError(message);
      showActionToast('error', message);
      return;
    }
    if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    previewRef.current = URL.createObjectURL(nextFile);
    setUrl(previewRef.current);
    setFile(nextFile);
  }

  async function save() {
    if (!file || isSaving) return;
    setIsSaving(true);
    setError(null);
    const supabase = createClient();
    const body = new FormData();
    body.set('file', file);
    body.set('target', kind === 'avatar' ? 'profile_avatar' : 'profile_header');
    const { data, error: uploadError } = await supabase.functions.invoke<UploadResponse>('process-image-upload', {
      body,
    });
    const nextPath = data?.path;

    if (uploadError || data?.error || !nextPath) {
      const message = t('uploadFailed');
      setError(message);
      showActionToast('error', message);
      setIsSaving(false);
      return;
    }

    const mutation =
      kind === 'avatar'
        ? supabase.schema('api').rpc('update_account_avatar_by_current_user', { input_avatar_path: nextPath })
        : supabase
            .schema('api')
            .rpc('update_account_header_image_by_current_user', { input_header_image_path: nextPath });
    const { error: mutationError } = await mutation;
    if (mutationError) {
      await supabase.storage.from('user-avatars').remove([nextPath]);
      const message = t('saveFailed');
      setError(message);
      showActionToast('error', message);
      setIsSaving(false);
      return;
    }

    if (path && path !== nextPath) await supabase.storage.from('user-avatars').remove([path]);
    if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    previewRef.current = null;
    setPath(nextPath);
    setUrl(data.signed_url ?? null);
    setFile(null);
    setIsSaving(false);
    showActionToast('success', t('saved', { label }));
    publishAccountSummaryChanged();
    router.refresh();
  }

  const label = kind === 'avatar' ? t('avatar') : t('header');
  return (
    <section className='sc-account-media' data-sc-account-media={kind}>
      <div className='sc-account-media-header'>
        <h3 className='sc-account-media-title'>{label}</h3>
        <p className='sc-account-media-help'>{t(kind === 'avatar' ? 'avatarHelp' : 'headerHelp')}</p>
      </div>
      <div
        aria-label={t('preview', { label })}
        className='sc-account-media-preview'
        data-kind={kind}
        role='img'
        style={url ? { backgroundImage: `url(${JSON.stringify(url).slice(1, -1)})` } : undefined}
      />
      <Input
        accept='image/jpeg,image/png,image/webp'
        aria-label={t('choose', { label })}
        onChange={(event) => selectFile(event.target.files?.[0])}
        type='file'
      />
      {error ? (
        <p className='sc-account-status' data-kind='error' role='alert'>
          {error}
        </p>
      ) : null}
      <Button disabled={!file || isSaving} onClick={save} type='button' variant='secondary'>
        {isSaving ? t('saving') : t('save', { label })}
      </Button>
    </section>
  );
}
