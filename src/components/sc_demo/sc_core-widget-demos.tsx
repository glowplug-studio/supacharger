'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Check, CheckCircle2, Crop, FileUp, Image as ImageIcon, PanelsTopLeft, UploadCloud, X } from 'lucide-react';
import { toast } from 'react-toastify';

import ImageLoader from '@/assets/svgr/ui/image-loader.svg';
import { LoginModal } from '@/components/sc_widgets/auth/login-modal';
import { ErrorPagePreviewButton } from '@/components/sc_widgets/error-page/error-page-preview-button';
import { FileUploadWidget } from '@/components/sc_widgets/file-upload/file-upload-widget';
import { ImageUploadWidget } from '@/components/sc_widgets/image-upload/image-upload-widget';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { SC_CONFIG } from '@/supacharger.config';
import { resolveToastOptions } from '@/supacharger/components/notifications/toast-options';

import type { ImageCrop } from '../../../supabase/functions/_shared/image-target-contract';

function useUploadSimulation() {
  const [progress, setProgress] = useState<number | null>(null);
  const timer = useRef<number | null>(null);

  function clearTimer() {
    if (timer.current !== null) window.clearInterval(timer.current);
    timer.current = null;
  }

  useEffect(
    () => () => {
      if (timer.current !== null) window.clearInterval(timer.current);
    },
    [],
  );

  function reset() {
    clearTimer();
    setProgress(null);
  }

  function start() {
    clearTimer();
    setProgress(0);
    timer.current = window.setInterval(() => {
      setProgress((current) => {
        const next = Math.min(100, (current ?? 0) + 10);
        if (next === 100) clearTimer();
        return next;
      });
    }, 180);
  }

  return { progress, reset, running: progress !== null && progress < 100, start };
}

function SimulationAction({
  completeLabel,
  disabled,
  progress,
  running,
  start,
  uploadAgainLabel,
  uploadLabel,
}: {
  completeLabel: string;
  disabled: boolean;
  progress: number | null;
  running: boolean;
  start: () => void;
  uploadAgainLabel: string;
  uploadLabel: string;
}) {
  return (
    <div className='mt-4 flex flex-wrap items-center gap-3'>
      <Button className='rounded-lg' disabled={disabled || running} type='button' variant='outline' onClick={start}>
        <UploadCloud aria-hidden='true' className='size-4' />
        {progress === 100 ? uploadAgainLabel : uploadLabel}
      </Button>
      {progress === 100 ? (
        <p className='flex items-center gap-2 text-sm text-muted-foreground' role='status'>
          <CheckCircle2 aria-hidden='true' className='size-4 text-primary' />
          {completeLabel}
        </p>
      ) : null}
    </div>
  );
}

function LoaderDemos({ imageLabel, inlineLabel, inverseLabel }: { imageLabel: string; inlineLabel: string; inverseLabel: string }) {
  return (
    <div className='grid gap-3 sm:grid-cols-3'>
      <div className='flex min-h-32 flex-col items-center justify-center gap-3 rounded-lg border border-border bg-background p-4 text-primary' role='status'>
        <LoadingSpinner className='size-9' fill='currentColor' label={inlineLabel} />
        <span className='text-sm text-foreground'>{inlineLabel}</span>
      </div>
      <div className='flex min-h-32 flex-col items-center justify-center gap-3 rounded-lg border border-border bg-primary p-4 text-primary-foreground' role='status'>
        <LoadingSpinner className='size-9' fill='currentColor' label={inverseLabel} variant='dark' />
        <span className='text-sm'>{inverseLabel}</span>
      </div>
      <div className='flex min-h-32 flex-col items-center justify-center gap-3 rounded-lg border border-border bg-muted/40 p-4 text-muted-foreground' role='status'>
        <ImageLoader aria-hidden='true' className='size-[50px] shrink-0' />
        <span className='text-sm text-foreground'>{imageLabel}</span>
      </div>
    </div>
  );
}

function ModalDemo({ cancelLabel, doneLabel, description, openLabel, title }: { cancelLabel: string; doneLabel: string; description: string; openLabel: string; title: string }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className='rounded-lg' type='button' variant='outline'>
          <PanelsTopLeft aria-hidden='true' className='size-4' />
          {openLabel}
        </Button>
      </DialogTrigger>
      <DialogContent className='gap-0 overflow-hidden rounded-lg p-0' motion='fade'>
        <DialogHeader className='border-b border-border p-6 pr-12'>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <DialogDescription className='p-6'>{description}</DialogDescription>
        <div className='flex items-center justify-between border-t border-border p-4'>
          <DialogClose asChild>
            <Button className='rounded-lg text-red-600 hover:text-red-600 dark:text-red-400 dark:hover:text-red-400' type='button' variant='ghost'>
              <X aria-hidden='true' className='size-4' />
              {cancelLabel}
            </Button>
          </DialogClose>
          <DialogClose asChild>
            <Button className='rounded-lg' type='button'>
              <Check aria-hidden='true' className='size-4' />
              {doneLabel}
            </Button>
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function UIDemos({
  cancelLabel,
  doneLabel,
  imageLoaderLabel,
  inlineLoaderLabel,
  inverseLoaderLabel,
  loadersTitle,
  modalDescription,
  modalOpenLabel,
  modalTitle,
  toastDescription,
  toastLabel,
  toastMessage,
  toastButtonLabel,
  gatingTitle,
  gatingDescription,
  gatingButtonLabel,
}: {
  cancelLabel: string;
  doneLabel: string;
  imageLoaderLabel: string;
  inlineLoaderLabel: string;
  inverseLoaderLabel: string;
  loadersTitle: string;
  modalDescription: string;
  modalOpenLabel: string;
  modalTitle: string;
  toastDescription: string;
  toastLabel: string;
  toastMessage: string;
  toastButtonLabel: string;
  gatingTitle: string;
  gatingDescription: string;
  gatingButtonLabel: string;
}) {
  function showToast() {
    toast.success(toastMessage, {
      ...resolveToastOptions(SC_CONFIG.TOAST_CONFIG),
      toastId: 'core-widget-demo-toast',
    });
  }

  return (
    <div className='flex flex-col gap-8'>
      <section>
        <h3 className='mb-3 text-sm font-medium text-foreground'>{loadersTitle}</h3>
        <LoaderDemos imageLabel={imageLoaderLabel} inlineLabel={inlineLoaderLabel} inverseLabel={inverseLoaderLabel} />
      </section>
      <ModalDemo cancelLabel={cancelLabel} doneLabel={doneLabel} description={modalDescription} openLabel={modalOpenLabel} title={modalTitle} />
      <div className='grid gap-4 sm:grid-cols-2'>
        <section className='flex flex-col items-start rounded-lg border border-border bg-background p-4'>
          <h3 className='text-sm font-medium text-foreground'>{toastLabel}</h3>
          <p className='mt-1 mb-4 text-sm text-muted-foreground'>{toastDescription}</p>
          <Button className='mt-auto rounded-lg' type='button' variant='outline' onClick={showToast}>
            {toastButtonLabel}
          </Button>
        </section>
        <section className='flex flex-col items-start rounded-lg border border-border bg-background p-4'>
          <h3 className='text-sm font-medium text-foreground'>{gatingTitle}</h3>
          <p className='mt-1 mb-4 text-sm text-muted-foreground'>{gatingDescription}</p>
          <LoginModal
            title={gatingTitle}
            description={gatingDescription}
            initialMode='signup'
            nextPath='/features/core-widget-demos'
            trigger={<Button className='mt-auto rounded-lg' type='button' variant='outline'>{gatingButtonLabel}</Button>}
          />
        </section>
      </div>
    </div>
  );
}

export function SCCoreWidgetDemos() {
  const t = useTranslations('MarketingFeaturePages.coreWidgetDemos');
  const fileCopy = useTranslations('SCWidgets.fileUpload');
  const cropCopy = useTranslations('SCWidgets.imageCrop');
  const [files, setFiles] = useState<File[]>([]);
  const [avatar, setAvatar] = useState<File | null>(null);
  const [avatarCrop, setAvatarCrop] = useState<ImageCrop | undefined>();
  const [banner, setBanner] = useState<File | null>(null);
  const [bannerCrop, setBannerCrop] = useState<ImageCrop | undefined>();
  const fileUpload = useUploadSimulation();
  const avatarUpload = useUploadSimulation();
  const bannerUpload = useUploadSimulation();
  const repositionCopy = {
    cancel: cropCopy('cancel'),
    circleDescription: cropCopy('circleDescription'),
    done: cropCopy('done'),
    dragLabel: cropCopy('dragLabel'),
    failed: cropCopy('failed'),
    rectangleDescription: cropCopy('rectangleDescription'),
    reposition: cropCopy('reposition'),
    title: cropCopy('title'),
    verticalDescription: cropCopy('verticalDescription'),
    verticalDragLabel: cropCopy('verticalDragLabel'),
    zoom: cropCopy('zoom'),
  };

  const demos = [
    {
      description: t('outageDescription'),
      icon: PanelsTopLeft,
      title: t('outageTitle'),
      widget: <ErrorPagePreviewButton kind='outage' label={t('outageToggle')} reloadHint={t('errorPreviewReload')} />,
    },
    {
      description: t('notFoundDescription'),
      icon: PanelsTopLeft,
      title: t('notFoundTitle'),
      widget: <ErrorPagePreviewButton kind='notFound' label={t('notFoundToggle')} reloadHint={t('errorPreviewReload')} />,
    },
    {
      description: t('genericDescription'),
      icon: FileUp,
      title: t('genericTitle'),
      widget: (
        <>
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
            isProcessing={fileUpload.running}
            label={fileCopy('label')}
            limitations={fileCopy('limitations')}
            name='widget_demo_files'
            processingText={t('uploading')}
            uploadProgress={fileUpload.progress ?? 0}
            onFilesChange={(nextFiles) => {
              setFiles(nextFiles);
              fileUpload.reset();
            }}
          />
          <SimulationAction
            completeLabel={t('uploadComplete')}
            disabled={!files.length}
            progress={fileUpload.progress}
            running={fileUpload.running}
            start={fileUpload.start}
            uploadAgainLabel={t('simulateAgain')}
            uploadLabel={t('simulateUpload')}
          />
        </>
      ),
    },
    {
      description: t('bannerDescription'),
      icon: ImageIcon,
      title: t('bannerTitle'),
      widget: (
        <>
          <ImageUploadWidget
            aspectRatio={8 / 3}
            file={banner}
            label={t('bannerLabel')}
            processing={bannerUpload.running}
            processingProgress={bannerUpload.progress ?? 0}
            processingText={t('uploading')}
            repositionCopy={repositionCopy}
            shape='rectangle'
            variant='banner'
            onChange={(nextFile) => {
              setBanner(nextFile);
              bannerUpload.reset();
            }}
            onCropChange={setBannerCrop}
          />
          <SimulationAction
            completeLabel={t('uploadComplete')}
            disabled={!banner}
            progress={bannerUpload.progress}
            running={bannerUpload.running}
            start={bannerUpload.start}
            uploadAgainLabel={t('simulateAgain')}
            uploadLabel={t('simulateUpload')}
          />
        </>
      ),
    },
    {
      description: t('avatarDescription'),
      icon: Crop,
      title: t('avatarTitle'),
      widget: (
        <>
          <ImageUploadWidget
            aspectRatio={1}
            file={avatar}
            label={t('avatarLabel')}
            processing={avatarUpload.running}
            processingProgress={avatarUpload.progress ?? 0}
            processingText={t('uploading')}
            repositionCopy={repositionCopy}
            shape='circle'
            variant='avatar'
            onChange={(nextFile) => {
              setAvatar(nextFile);
              avatarUpload.reset();
            }}
            onCropChange={setAvatarCrop}
          />
          <SimulationAction
            completeLabel={t('uploadComplete')}
            disabled={!avatar}
            progress={avatarUpload.progress}
            running={avatarUpload.running}
            start={avatarUpload.start}
            uploadAgainLabel={t('simulateAgain')}
            uploadLabel={t('simulateUpload')}
          />
        </>
      ),
    },
    {
      description: t('modalDescription'),
      icon: PanelsTopLeft,
      title: t('modalTitle'),
      widget: (
        <UIDemos
          cancelLabel={t('cancelModal')}
          doneLabel={t('doneModal')}
          imageLoaderLabel={t('imageLoaderLabel')}
          inlineLoaderLabel={t('inlineLoaderLabel')}
          inverseLoaderLabel={t('inverseLoaderLabel')}
          loadersTitle={t('loadersTitle')}
          modalDescription={t('modalBody')}
          modalOpenLabel={t('openModal')}
          modalTitle={t('modalDialogTitle')}
          toastDescription={t('toastDescription')}
          toastLabel={t('toastLabel')}
          toastMessage={t('toastMessage')}
          toastButtonLabel={t('toastButtonLabel')}
          gatingTitle={t('gatingTitle')}
          gatingDescription={t('gatingDescription')}
          gatingButtonLabel={t('gatingButtonLabel')}
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
          {demos.map(({ description, icon: Icon, title, widget }) => (
            <article className='grid overflow-hidden rounded-lg border border-border bg-card lg:grid-cols-[0.62fr_1.38fr]' key={title}>
              <div className='border-b border-border p-6 lg:border-r lg:border-b-0 lg:p-8'>
                <div className='flex size-10 items-center justify-center rounded-lg border border-border bg-background text-primary'>
                  <Icon aria-hidden='true' className='size-4' />
                </div>
                <h2 className='mt-8 text-2xl font-medium tracking-tight'>{title}</h2>
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
