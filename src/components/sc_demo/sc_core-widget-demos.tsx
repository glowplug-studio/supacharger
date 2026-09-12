'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Crop, FileUp, Image as ImageIcon } from 'lucide-react';

import { FileUploadWidget } from '@/components/sc_widgets/file-upload/file-upload-widget';
import { ImageUploadWidget } from '@/components/sc_widgets/image-upload/image-upload-widget';

import type { ImageCrop } from '../../../supabase/functions/_shared/image-target-contract';

export function SCCoreWidgetDemos() {
  const t = useTranslations('MarketingFeaturePages.coreWidgetDemos');
  const fileCopy = useTranslations('SCWidgets.fileUpload');
  const [files, setFiles] = useState<File[]>([]);
  const [avatar, setAvatar] = useState<File | null>(null);
  const [avatarCrop, setAvatarCrop] = useState<ImageCrop | undefined>();
  const [banner, setBanner] = useState<File | null>(null);
  const [bannerCrop, setBannerCrop] = useState<ImageCrop | undefined>();

  const demos = [
    {
      description: t('genericDescription'),
      icon: FileUp,
      title: t('genericTitle'),
      widget: (
        <FileUploadWidget
          accept='.pdf,.txt,.csv,image/*'
          copy={{
            add: fileCopy('add'),
            drop: fileCopy('drop'),
            emptyFile: fileCopy('emptyFile'),
            invalidType: fileCopy('invalidType'),
            remove: fileCopy('remove'),
            tooLarge: (size) => fileCopy('tooLarge', { size }),
          }}
          description={fileCopy('description')}
          files={files}
          label={fileCopy('label')}
          limitations={fileCopy('limitations')}
          name='widget_demo_files'
          onFilesChange={setFiles}
        />
      ),
    },
    {
      description: t('bannerDescription'),
      icon: ImageIcon,
      title: t('bannerTitle'),
      widget: (
        <ImageUploadWidget
          aspectRatio={8 / 3}
          file={banner}
          label={t('bannerLabel')}
          shape='rectangle'
          variant='banner'
          onChange={setBanner}
          onCropChange={setBannerCrop}
        />
      ),
    },
    {
      description: t('avatarDescription'),
      icon: Crop,
      title: t('avatarTitle'),
      widget: (
        <ImageUploadWidget
          aspectRatio={1}
          file={avatar}
          label={t('avatarLabel')}
          shape='circle'
          variant='avatar'
          onChange={setAvatar}
          onCropChange={setAvatarCrop}
        />
      ),
    },
  ];

  return (
    <div className='bg-background text-foreground'>
      <section className='px-4 pt-24 pb-14 sm:px-6 lg:px-8 lg:pb-20'>
        <div className='mx-auto max-w-7xl'>
          <p className='text-primary text-sm font-medium'>{t('eyebrow')}</p>
          <h1 className='mt-4 max-w-4xl text-4xl leading-[1.08] font-normal tracking-[-0.04em] text-balance sm:text-6xl'>
            {t('title')}
          </h1>
          <p className='mt-6 max-w-2xl text-base leading-7 text-muted-foreground'>{t('description')}</p>
        </div>
      </section>

      <section className='border-y border-border bg-muted/20 px-4 py-14 sm:px-6 lg:px-8 lg:py-20'>
        <div className='mx-auto max-w-7xl space-y-6'>
          {demos.map(({ description, icon: Icon, title, widget }, index) => (
            <article className='grid overflow-hidden rounded-lg border border-border bg-card lg:grid-cols-[0.62fr_1.38fr]' key={title}>
              <div className='border-b border-border p-6 lg:border-r lg:border-b-0 lg:p-8'>
                <div className='flex size-10 items-center justify-center rounded-md border border-border bg-background text-primary'>
                  <Icon aria-hidden='true' className='size-4' />
                </div>
                <p className='mt-8 font-mono text-xs text-muted-foreground'>0{index + 1}</p>
                <h2 className='mt-3 text-2xl font-medium tracking-tight'>{title}</h2>
                <p className='mt-3 max-w-sm text-sm leading-6 text-muted-foreground'>{description}</p>
              </div>
              <div className='p-5 sm:p-8'>{widget}</div>
            </article>
          ))}
        </div>
      </section>

      <span className='sr-only'>
        {avatarCrop ? JSON.stringify(avatarCrop) : ''}
        {bannerCrop ? JSON.stringify(bannerCrop) : ''}
      </span>
    </div>
  );
}
