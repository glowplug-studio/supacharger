'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

import { createClient } from '@/lib/supabase/client';
import { publishAccountSummaryChanged } from '@/supacharger/account/account-summary-events';
import { Button } from '@/supacharger/components/primitives/button';
import { Input } from '@/supacharger/components/primitives/input';
import { cn } from '@/utils/cn';

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

  useEffect(() => () => {
    if (previewRef.current) URL.revokeObjectURL(previewRef.current);
  }, []);

  function selectFile(nextFile: File | undefined) {
    setError(null);
    if (!nextFile) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(nextFile.type) || nextFile.size > 5 * 1024 * 1024) {
      setError(t('invalidFile'));
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
    const { data, error: uploadError } = await supabase.functions.invoke<UploadResponse>('process-image-upload', { body });
    const nextPath = data?.path;

    if (uploadError || data?.error || !nextPath) {
      setError(t('uploadFailed'));
      setIsSaving(false);
      return;
    }

    const mutation = kind === 'avatar'
      ? supabase.schema('api').rpc('update_account_avatar_by_current_user', { input_avatar_path: nextPath })
      : supabase.schema('api').rpc('update_account_header_image_by_current_user', { input_header_image_path: nextPath });
    const { error: mutationError } = await mutation;
    if (mutationError) {
      await supabase.storage.from('user-avatars').remove([nextPath]);
      setError(t('saveFailed'));
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
    publishAccountSummaryChanged();
    router.refresh();
  }

  const label = kind === 'avatar' ? t('avatar') : t('header');
  return (
    <section className='space-y-3' data-sc-account-media={kind}>
      <div>
        <h3 className='text-sm font-semibold'>{label}</h3>
        <p className='text-muted-foreground text-sm'>{t(kind === 'avatar' ? 'avatarHelp' : 'headerHelp')}</p>
      </div>
      <div
        aria-label={t('preview', { label })}
        className={cn(
          'border-border bg-muted bg-cover bg-center',
          kind === 'avatar' ? 'size-24 rounded-full' : 'aspect-[8/3] w-full max-w-xl rounded-lg',
        )}
        role='img'
        style={url ? { backgroundImage: `url(${JSON.stringify(url).slice(1, -1)})` } : undefined}
      />
      <Input
        accept='image/jpeg,image/png,image/webp'
        aria-label={t('choose', { label })}
        onChange={(event) => selectFile(event.target.files?.[0])}
        type='file'
      />
      {error ? <p className='text-destructive text-sm' role='alert'>{error}</p> : null}
      <Button disabled={!file || isSaving} onClick={save} type='button' variant='secondary'>
        {isSaving ? t('saving') : t('save', { label })}
      </Button>
    </section>
  );
}
