'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { publishAccountSummaryChanged } from '@/supacharger/account/account-summary-events';
import type { AccountProfileMediaProps } from '@/supacharger/account/settings/account-settings-contract';
import { showActionToast } from '@/supacharger/components/notifications/action-toast';

import type { ImageCrop } from '../../../../supabase/functions/_shared/image-target-contract';
import { ImageUploadWidget } from '../image-upload/image-upload-widget';
import { profileImageWidgetPolicy } from '../image-upload/project-image-policy';
import { CroppedImagePreview } from '../media/cropped-image-preview';
import { uploadProjectImage } from '../media/project-image-upload';
import { useObjectUrl } from '../media/use-object-url';

type MediaKind = 'avatar' | 'banner';

export type AccountProfileMediaWidgetProps = AccountProfileMediaProps;

export function AccountProfileMediaWidget(props: AccountProfileMediaWidgetProps) {
  const router = useRouter();
  const t = useTranslations('SCWidgets.profileMedia');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarCrop, setAvatarCrop] = useState<ImageCrop | undefined>();
  const [avatarPath, setAvatarPath] = useState(props.initialAvatarPath);
  const [avatarUrl, setAvatarUrl] = useState(props.initialAvatarUrl);
  const [headerFile, setHeaderFile] = useState<File | null>(null);
  const [headerCrop, setHeaderCrop] = useState<ImageCrop | undefined>();
  const [headerPath, setHeaderPath] = useState(props.initialHeaderPath);
  const [headerUrl, setHeaderUrl] = useState(props.initialHeaderUrl);
  const [saving, setSaving] = useState<MediaKind | null>(null);
  const [message, setMessage] = useState<{ kind: 'error' | 'success'; text: string } | null>(null);
  const avatarObjectUrl = useObjectUrl(avatarFile);
  const headerObjectUrl = useObjectUrl(headerFile);

  async function save(kind: MediaKind) {
    const isAvatar = kind === 'avatar';
    const file = isAvatar ? avatarFile : headerFile;
    if (!file || saving) return;

    const policy = profileImageWidgetPolicy[kind];
    const crop = isAvatar ? avatarCrop : headerCrop;
    const previousPath = isAvatar ? avatarPath : headerPath;
    setMessage(null);
    setSaving(kind);

    try {
      const result = await uploadProjectImage({
        crop,
        destination: policy.destination,
        file,
        target: policy.target,
      });
      const nextPath = result.path;
      if (!nextPath) throw new Error(t('uploadFailed'));

      const supabase = createClient();
      const mutation = isAvatar
        ? supabase.schema('api').rpc('update_account_avatar_by_current_user', { input_avatar_path: nextPath })
        : supabase
            .schema('api')
            .rpc('update_account_header_image_by_current_user', { input_header_image_path: nextPath });
      const { error: mutationError } = await mutation;

      if (mutationError) {
        await supabase.storage.from(policy.bucket).remove([nextPath]);
        throw mutationError;
      }

      if (previousPath && previousPath !== nextPath) {
        await supabase.storage.from(policy.bucket).remove([previousPath]);
      }

      if (isAvatar) {
        setAvatarPath(nextPath);
        setAvatarUrl(result.signed_url ?? avatarUrl);
        setAvatarFile(null);
      } else {
        setHeaderPath(nextPath);
        setHeaderUrl(result.signed_url ?? headerUrl);
        setHeaderFile(null);
      }

      const successMessage = t('saved', { label: t(kind) });
      setMessage({ kind: 'success', text: successMessage });
      showActionToast('success', successMessage);
      publishAccountSummaryChanged();
      router.refresh();
    } catch (error) {
      const message = error instanceof Error && error.message ? error.message : t('saveFailed');
      setMessage({ kind: 'error', text: message });
      showActionToast('error', message);
    } finally {
      setSaving(null);
    }
  }

  const displayName = [props.firstName, props.lastName].filter(Boolean).join(' ') || t('unnamed');

  return (
    <section className='space-y-6' data-sc-widget='account-profile-media'>
      <div>
        <h2 className='text-xl font-semibold tracking-tight text-foreground'>{t('title')}</h2>
        <p className='mt-1 text-sm text-muted-foreground'>{t('description')}</p>
      </div>

      <div className='overflow-hidden rounded-lg border border-border bg-card'>
        <CroppedImagePreview
          alt={t('bannerPreviewAlt')}
          className='aspect-[8/3] w-full rounded-none'
          crop={headerFile ? headerCrop : undefined}
          src={headerObjectUrl ?? headerUrl}
        />
        <div className='relative flex min-h-28 items-center gap-4 px-5 pb-5 sm:px-8'>
          <CroppedImagePreview
            alt={t('avatarPreviewAlt')}
            className='-mt-10 size-24 shrink-0 border-4 border-card sm:size-28'
            crop={avatarFile ? avatarCrop : undefined}
            shape='circle'
            src={avatarObjectUrl ?? avatarUrl}
          />
          <div className='min-w-0 pt-4'>
            <p className='truncate text-xl font-semibold text-card-foreground sm:text-2xl'>{displayName}</p>
            {props.username ? <p className='truncate text-sm text-muted-foreground'>@{props.username}</p> : null}
          </div>
        </div>
      </div>

      <div className='grid gap-6 lg:grid-cols-2'>
        {props.headerEnabled ? (
          <div className='space-y-3'>
            <ImageUploadWidget
              aspectRatio={profileImageWidgetPolicy.banner.aspectRatio}
              existingPreviewUrl={headerUrl}
              file={headerFile}
              label={t('banner')}
              maxBytes={profileImageWidgetPolicy.banner.maxInputBytes}
              processing={saving === 'banner'}
              shape={profileImageWidgetPolicy.banner.shape}
              variant='banner'
              onChange={setHeaderFile}
              onCropChange={setHeaderCrop}
            />
            <Button disabled={!headerFile || Boolean(saving)} type='button' onClick={() => void save('banner')}>
              {saving === 'banner' ? t('saving') : t('save', { label: t('banner') })}
            </Button>
          </div>
        ) : null}
        {props.avatarEnabled ? (
          <div className='space-y-3'>
            <ImageUploadWidget
              aspectRatio={profileImageWidgetPolicy.avatar.aspectRatio}
              existingPreviewUrl={avatarUrl}
              file={avatarFile}
              label={t('avatar')}
              maxBytes={profileImageWidgetPolicy.avatar.maxInputBytes}
              processing={saving === 'avatar'}
              shape={profileImageWidgetPolicy.avatar.shape}
              variant='avatar'
              onChange={setAvatarFile}
              onCropChange={setAvatarCrop}
            />
            <Button disabled={!avatarFile || Boolean(saving)} type='button' onClick={() => void save('avatar')}>
              {saving === 'avatar' ? t('saving') : t('save', { label: t('avatar') })}
            </Button>
          </div>
        ) : null}
      </div>

      {message ? (
        <p
          className={message.kind === 'error' ? 'text-sm text-destructive' : 'text-sm text-muted-foreground'}
          role={message.kind === 'error' ? 'alert' : 'status'}
        >
          {message.text}
        </p>
      ) : null}
    </section>
  );
}
