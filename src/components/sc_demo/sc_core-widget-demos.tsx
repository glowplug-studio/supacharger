'use client';

import { type ReactNode, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import {
  ArrowRight,
  Check,
  CheckCircle2,
  Crop,
  FileUp,
  Image as ImageIcon,
  PanelsTopLeft,
  UploadCloud,
  X,
} from 'lucide-react';
import { toast } from 'react-toastify';

import ImageLoader from '@/assets/svgr/ui/image-loader.svg';
import { LoginModal } from '@/components/sc_widgets/auth/login-modal';
import { ErrorPagePreviewButton } from '@/components/sc_widgets/error-page/error-page-preview-button';
import { FileUploadWidget } from '@/components/sc_widgets/file-upload/file-upload-widget';
import { ImageUploadWidget } from '@/components/sc_widgets/image-upload/image-upload-widget';
import { DemoConfettiToggle } from '@/components/sc_widgets/paywall/demo-confetti';
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
import { Input } from '@/components/ui/input';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Switch } from '@/components/ui/switch';
import { SC_CONFIG } from '@/supacharger.config';
import { ClipboardCopyButton } from '@/supacharger/components/buttons/clipboard-copy-button';
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
        <p className='text-muted-foreground flex items-center gap-2 text-sm' role='status'>
          <CheckCircle2 aria-hidden='true' className='text-primary size-4' />
          {completeLabel}
        </p>
      ) : null}
    </div>
  );
}

function LoaderDemos({
  imageLabel,
  inlineLabel,
  inverseLabel,
}: {
  imageLabel: string;
  inlineLabel: string;
  inverseLabel: string;
}) {
  return (
    <div className='grid gap-3 sm:grid-cols-3'>
      <div
        className='border-border bg-background text-primary flex min-h-32 flex-col items-center justify-center gap-3 rounded-lg border p-4'
        role='status'
      >
        <LoadingSpinner className='size-9' fill='currentColor' label={inlineLabel} />
        <span className='text-foreground text-sm'>{inlineLabel}</span>
      </div>
      <div
        className='border-border bg-primary text-primary-foreground flex min-h-32 flex-col items-center justify-center gap-3 rounded-lg border p-4'
        role='status'
      >
        <LoadingSpinner className='size-9' fill='currentColor' label={inverseLabel} variant='dark' />
        <span className='text-sm'>{inverseLabel}</span>
      </div>
      <div
        className='border-border bg-muted/40 text-muted-foreground flex min-h-32 flex-col items-center justify-center gap-3 rounded-lg border p-4'
        role='status'
      >
        <ImageLoader aria-hidden='true' className='size-[50px] shrink-0' />
        <span className='text-foreground text-sm'>{imageLabel}</span>
      </div>
    </div>
  );
}

function ModalDemo({
  cancelLabel,
  doneLabel,
  description,
  openLabel,
  title,
}: {
  cancelLabel: string;
  doneLabel: string;
  description: string;
  openLabel: string;
  title: string;
}) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className='rounded-lg' type='button' variant='outline'>
          <PanelsTopLeft aria-hidden='true' className='size-4' />
          {openLabel}
        </Button>
      </DialogTrigger>
      <DialogContent className='gap-0 overflow-hidden rounded-lg p-0' motion='fade'>
        <DialogHeader className='border-border border-b p-6 pr-12'>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <DialogDescription className='p-6'>{description}</DialogDescription>
        <div className='border-border flex items-center justify-between border-t p-4'>
          <DialogClose asChild>
            <Button
              className='rounded-lg text-red-600 hover:text-red-600 dark:text-red-400 dark:hover:text-red-400'
              type='button'
              variant='ghost'
            >
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

function ExitIntentDemo({
  accessLabel,
  ctaLabel,
  description,
  dialogDescription,
  dialogTitle,
  disableLabel,
  dismissLabel,
  enabledHint,
  enableLabel,
  eyebrow,
  featureLabels,
  label,
  priceLabel,
  priceNote,
}: {
  accessLabel: string;
  ctaLabel: string;
  description: string;
  dialogDescription: string;
  dialogTitle: string;
  disableLabel: string;
  dismissLabel: string;
  enabledHint: string;
  enableLabel: string;
  eyebrow: string;
  featureLabels: string[];
  label: string;
  priceLabel: string;
  priceNote: string;
}) {
  const [enabled, setEnabled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!enabled || open) return;

    function handlePointerLeave(event: MouseEvent) {
      if (event.clientY <= 0 && !event.relatedTarget) setOpen(true);
    }

    document.addEventListener('mouseout', handlePointerLeave);
    return () => document.removeEventListener('mouseout', handlePointerLeave);
  }, [enabled, open]);

  return (
    <>
      <section className='border-border bg-background flex flex-col items-start rounded-lg border p-4'>
        <div className='flex w-full items-start justify-between gap-4'>
          <div>
            <h3 className='text-foreground text-sm font-medium'>{label}</h3>
            <p className='text-muted-foreground mt-1 text-sm'>{description}</p>
          </div>
          <Switch
            aria-label={enabled ? disableLabel : enableLabel}
            checked={enabled}
            className='mt-0.5'
            onCheckedChange={(checked) => {
              setEnabled(checked);
              if (!checked) setOpen(false);
            }}
          />
        </div>
        {enabled ? (
          <p className='text-primary mt-4 flex items-center gap-2 text-sm font-medium' role='status'>
            <span aria-hidden='true' className='size-2 rounded-full bg-current' />
            {enabledHint}
          </p>
        ) : null}
      </section>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          className='border-border max-h-[calc(100dvh-2rem)] max-w-5xl gap-0 overflow-y-auto rounded-2xl p-0'
          motion='fade'
        >
          <div className='grid min-h-[34rem] md:grid-cols-[0.82fr_1.18fr]'>
            <aside className='bg-secondary text-secondary-foreground relative flex flex-col overflow-hidden p-8 sm:p-10'>
              <div
                aria-hidden='true'
                className='border-secondary-foreground/10 absolute -right-24 -bottom-36 size-96 rounded-full border'
              />
              <div
                aria-hidden='true'
                className='border-secondary-foreground/10 absolute -right-8 -bottom-52 size-96 rounded-full border'
              />
              <p className='relative text-xs font-semibold tracking-[0.2em] uppercase'>{eyebrow}</p>
              <div className='relative my-auto py-12'>
                <p className='text-5xl leading-none font-medium tracking-[-0.06em] sm:text-7xl'>{accessLabel}</p>
                <p className='mt-5 max-w-xs text-lg leading-7'>{priceNote}</p>
              </div>
              <div className='relative border-t border-current/20 pt-7'>
                <p className='text-4xl font-medium tracking-[-0.04em]'>{priceLabel}</p>
              </div>
            </aside>

            <div className='bg-card text-card-foreground flex flex-col p-8 sm:p-10 md:p-12'>
              <div className='my-auto'>
                <DialogHeader>
                  <DialogTitle className='max-w-xl text-3xl leading-tight font-medium tracking-[-0.04em] text-balance sm:text-5xl'>
                    {dialogTitle}
                  </DialogTitle>
                  <DialogDescription className='text-muted-foreground mt-5 max-w-lg text-base leading-7'>
                    {dialogDescription}
                  </DialogDescription>
                </DialogHeader>
                <ul className='mt-8 grid gap-4 sm:grid-cols-2' role='list'>
                  {featureLabels.map((feature) => (
                    <li className='text-muted-foreground flex items-start gap-3 text-sm leading-6' key={feature}>
                      <Check aria-hidden='true' className='text-primary mt-1 size-4 shrink-0' />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Button asChild className='mt-10 h-12 w-full rounded-lg text-base'>
                  <Link href='/account/create'>
                    {ctaLabel}
                    <ArrowRight aria-hidden='true' className='size-4' />
                  </Link>
                </Button>
                <DialogClose asChild>
                  <Button className='mt-3 w-full rounded-lg' type='button' variant='ghost'>
                    {dismissLabel}
                  </Button>
                </DialogClose>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
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
  confettiDescription,
  confettiLabel,
  exitIntentAccessLabel,
  exitIntentCtaLabel,
  exitIntentDescription,
  exitIntentDialogDescription,
  exitIntentDialogTitle,
  exitIntentDisableLabel,
  exitIntentDismissLabel,
  exitIntentEnabledHint,
  exitIntentEnableLabel,
  exitIntentEyebrow,
  exitIntentFeatures,
  exitIntentLabel,
  exitIntentPriceLabel,
  exitIntentPriceNote,
  toastDescription,
  toastLabel,
  toastMessage,
  toastButtonLabel,
  copyDemoDescription,
  copyDemoLabel,
  copyDemoValue,
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
  confettiDescription: string;
  confettiLabel: string;
  exitIntentAccessLabel: string;
  exitIntentCtaLabel: string;
  exitIntentDescription: string;
  exitIntentDialogDescription: string;
  exitIntentDialogTitle: string;
  exitIntentDisableLabel: string;
  exitIntentDismissLabel: string;
  exitIntentEnabledHint: string;
  exitIntentEnableLabel: string;
  exitIntentEyebrow: string;
  exitIntentFeatures: string[];
  exitIntentLabel: string;
  exitIntentPriceLabel: string;
  exitIntentPriceNote: string;
  toastDescription: string;
  toastLabel: string;
  toastMessage: string;
  toastButtonLabel: string;
  copyDemoDescription: string;
  copyDemoLabel: string;
  copyDemoValue: string;
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
        <h3 className='text-foreground mb-3 text-sm font-medium'>{loadersTitle}</h3>
        <LoaderDemos imageLabel={imageLoaderLabel} inlineLabel={inlineLoaderLabel} inverseLabel={inverseLoaderLabel} />
      </section>
      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
        <section className='border-border bg-background flex flex-col items-start rounded-lg border p-4'>
          <h3 className='text-foreground text-sm font-medium'>{toastLabel}</h3>
          <p className='text-muted-foreground mt-1 mb-4 text-sm'>{toastDescription}</p>
          <Button className='mt-auto rounded-lg' type='button' variant='outline' onClick={showToast}>
            {toastButtonLabel}
          </Button>
        </section>
        <section className='border-border bg-background flex flex-col items-start rounded-lg border p-4'>
          <h3 className='text-foreground text-sm font-medium'>{gatingTitle}</h3>
          <p className='text-muted-foreground mt-1 mb-4 text-sm'>{gatingDescription}</p>
          <LoginModal
            title={gatingTitle}
            description={gatingDescription}
            initialMode='signup'
            nextPath='/features/core-widget-demos'
            trigger={
              <Button className='mt-auto rounded-lg' type='button' variant='outline'>
                {gatingButtonLabel}
              </Button>
            }
          />
        </section>
        <section className='border-border bg-background flex flex-col items-start rounded-lg border p-4'>
          <h3 className='text-foreground text-sm font-medium'>{modalTitle}</h3>
          <p className='text-muted-foreground mt-1 mb-4 text-sm'>{modalDescription}</p>
          <div className='mt-auto'>
            <ModalDemo
              cancelLabel={cancelLabel}
              doneLabel={doneLabel}
              description={modalDescription}
              openLabel={modalOpenLabel}
              title={modalTitle}
            />
          </div>
        </section>
        <section className='border-border bg-background flex min-w-0 flex-col items-start rounded-lg border p-4'>
          <h3 className='text-foreground text-sm font-medium'>{copyDemoLabel}</h3>
          <p className='text-muted-foreground mt-1 mb-4 text-sm'>{copyDemoDescription}</p>
          <div className='relative mt-auto w-full'>
            <Input
              aria-label={copyDemoLabel}
              className='bg-background h-10 pr-12 text-sm'
              readOnly
              value={copyDemoValue}
            />
            <div className='border-border absolute inset-y-0 right-0 flex items-center border-l px-1'>
              <ClipboardCopyButton className='size-8 rounded-sm' size='icon' value={copyDemoValue} variant='ghost' />
            </div>
          </div>
        </section>
      </div>
      <div className='grid gap-4 md:grid-cols-2'>
        <section className='border-border bg-background flex flex-col items-start rounded-lg border p-4'>
          <h3 className='text-foreground text-sm font-medium'>{confettiLabel}</h3>
          <p className='text-muted-foreground mt-1 mb-4 text-sm'>{confettiDescription}</p>
          <DemoConfettiToggle />
        </section>
        <ExitIntentDemo
          accessLabel={exitIntentAccessLabel}
          ctaLabel={exitIntentCtaLabel}
          description={exitIntentDescription}
          dialogDescription={exitIntentDialogDescription}
          dialogTitle={exitIntentDialogTitle}
          disableLabel={exitIntentDisableLabel}
          dismissLabel={exitIntentDismissLabel}
          enabledHint={exitIntentEnabledHint}
          enableLabel={exitIntentEnableLabel}
          eyebrow={exitIntentEyebrow}
          featureLabels={exitIntentFeatures}
          label={exitIntentLabel}
          priceLabel={exitIntentPriceLabel}
          priceNote={exitIntentPriceNote}
        />
      </div>
    </div>
  );
}

export function SCCoreWidgetDemos({ developerTools }: { developerTools: ReactNode }) {
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
      widget: (
        <ErrorPagePreviewButton kind='notFound' label={t('notFoundToggle')} reloadHint={t('errorPreviewReload')} />
      ),
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
          confettiDescription={t('confettiDescription')}
          confettiLabel={t('confettiLabel')}
          exitIntentAccessLabel={t('exitIntentAccessLabel')}
          exitIntentCtaLabel={t('exitIntentCtaLabel')}
          exitIntentDescription={t('exitIntentDescription')}
          exitIntentDialogDescription={t('exitIntentDialogDescription')}
          exitIntentDialogTitle={t('exitIntentDialogTitle')}
          exitIntentDisableLabel={t('exitIntentDisableLabel')}
          exitIntentDismissLabel={t('exitIntentDismissLabel')}
          exitIntentEnabledHint={t('exitIntentEnabledHint')}
          exitIntentEnableLabel={t('exitIntentEnableLabel')}
          exitIntentEyebrow={t('exitIntentEyebrow')}
          exitIntentFeatures={t.raw('exitIntentFeatures') as string[]}
          exitIntentLabel={t('exitIntentLabel')}
          exitIntentPriceLabel={t('exitIntentPriceLabel')}
          exitIntentPriceNote={t('exitIntentPriceNote')}
          toastDescription={t('toastDescription')}
          toastLabel={t('toastLabel')}
          toastMessage={t('toastMessage')}
          toastButtonLabel={t('toastButtonLabel')}
          copyDemoDescription={t('copyDemoDescription')}
          copyDemoLabel={t('copyDemoLabel')}
          copyDemoValue={t('copyDemoValue')}
          gatingTitle={t('gatingTitle')}
          gatingDescription={t('gatingDescription')}
          gatingButtonLabel={t('gatingButtonLabel')}
        />
      ),
    },
  ];

  return (
    <div className='bg-background text-foreground min-h-screen pt-16'>
      <section className='border-border border-b'>
        <div className='mx-auto w-full max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28'>
          <h1 className='max-w-4xl text-4xl font-normal tracking-[-0.04em] text-balance sm:text-5xl'>{t('title')}</h1>
          <p className='text-muted-foreground mt-6 max-w-3xl text-base leading-7'>{t('description')}</p>
          <p className='text-muted-foreground mt-4 text-sm leading-6'>
            {t('builtOnPrefix')}{' '}
            <a
              className='text-foreground decoration-border focus-visible:outline-ring font-medium underline underline-offset-4 transition-colors hover:decoration-current focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2'
              href='https://ui.shadcn.com/'
              rel='noreferrer'
              target='_blank'
            >
              shadcn/ui
            </a>
            .
          </p>
        </div>
      </section>

      <section className='border-border bg-muted/20 border-y py-14 lg:py-20'>
        <div className='mx-auto w-full max-w-7xl space-y-6 px-4 sm:px-6 lg:px-8'>
          {[[demos[0], demos[1]], [demos[2]], [demos[3], demos[4]], [demos[5]]].map((group) => (
            <div key={group[0].title} className={group.length === 2 ? 'grid gap-6 md:grid-cols-2' : ''}>
              {group.map(({ description, icon: Icon, title, widget }) => (
                <article
                  className={`border-border bg-card grid overflow-hidden rounded-lg border ${group.length === 1 ? 'lg:grid-cols-[0.62fr_1.38fr]' : ''}`}
                  key={title}
                >
                  <div
                    className={`border-border border-b p-6 lg:p-8 ${group.length === 1 ? 'lg:border-r lg:border-b-0' : ''}`}
                  >
                    <div className='border-border bg-background text-primary flex size-10 items-center justify-center rounded-lg border'>
                      <Icon aria-hidden='true' className='size-4' />
                    </div>
                    <h2 className='mt-8 text-2xl font-medium tracking-tight'>{title}</h2>
                    <p className='text-muted-foreground mt-3 max-w-sm text-sm leading-6'>{description}</p>
                  </div>
                  <div className='p-5 sm:p-8'>{widget}</div>
                </article>
              ))}
            </div>
          ))}
        </div>
      </section>

      <section className='border-border border-b py-8'>
        <div className='mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8'>
          <div>
            <h2 className='text-2xl font-medium tracking-tight'>{t('paywallStripTitle')}</h2>
            <p className='text-muted-foreground mt-3 text-sm'>{t('paywallStripDescription')}</p>
          </div>
          <Button asChild className='shrink-0 rounded-lg' variant='outline'>
            <Link href='/features/paywall-demos'>{t('paywallLink')}</Link>
          </Button>
        </div>
      </section>

      {developerTools}

      <span className='sr-only'>
        {avatarCrop ? JSON.stringify(avatarCrop) : ''}
        {bannerCrop ? JSON.stringify(bannerCrop) : ''}
      </span>
    </div>
  );
}
