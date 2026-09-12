'use client';

import { type ChangeEvent, type DragEvent, useRef, useState } from 'react';
import { ImageIcon, Trash2, Upload } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/utils/cn';

import type { ImageCrop } from '../../../../supabase/functions/_shared/image-target-contract';
import { BannerCropPreview } from '../media/banner-crop-preview';
import { calculateImageCrop } from '../media/image-crop';
import { ImageRepositionDialog } from '../media/image-reposition-dialog';
import { ImageWithLoader } from '../media/image-with-loader';
import { useObjectUrl } from '../media/use-object-url';

export type ImageUploadWidgetCopy = {
  change: string;
  current: string;
  drag: string;
  invalid: string;
  remove: string;
  select: string;
  tooLarge: (size: string) => string;
};

const defaultCopy: ImageUploadWidgetCopy = {
  change: 'Change image',
  current: 'Current image',
  drag: 'Drag an image here, or choose one from your device.',
  invalid: 'Use a JPEG, PNG or WebP image.',
  remove: 'Remove selected image',
  select: 'Select image',
  tooLarge: (size) => `Image must be ${size} or smaller.`,
};

const IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export function ImageUploadWidget({
  aspectRatio,
  className,
  copy = defaultCopy,
  description = 'JPEG, PNG or WebP.',
  disabled = false,
  existingPreviewUrl,
  file,
  label,
  maxBytes = 5 * 1024 * 1024,
  onChange,
  onCropChange,
  processing = false,
  processingText = 'Processing image…',
  shape,
  variant,
}: {
  aspectRatio: number;
  className?: string;
  copy?: ImageUploadWidgetCopy;
  description?: string;
  disabled?: boolean;
  existingPreviewUrl?: string | null;
  file: File | null;
  label: string;
  maxBytes?: number;
  onChange: (file: File | null) => void;
  onCropChange: (crop: ImageCrop | undefined, preview?: string) => void;
  processing?: boolean;
  processingText?: string;
  shape: 'circle' | 'rectangle';
  variant: 'avatar' | 'banner';
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [crop, setCrop] = useState<ImageCrop | undefined>();
  const [cropPreview, setCropPreview] = useState<string | undefined>();
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const objectUrl = useObjectUrl(file);
  const previewUrl = cropPreview ?? objectUrl ?? existingPreviewUrl ?? null;
  const isDisabled = disabled || processing;

  function updateCrop(nextCrop: ImageCrop | undefined, preview?: string) {
    setCrop(nextCrop);
    setCropPreview(preview);
    onCropChange(nextCrop, preview);
  }

  function selectFile(nextFile: File | undefined) {
    setError(null);
    if (!nextFile) return;
    if (!IMAGE_MIME_TYPES.includes(nextFile.type)) {
      setError(copy.invalid);
      return;
    }
    if (nextFile.size > maxBytes) {
      setError(copy.tooLarge(`${Math.round(maxBytes / 1024 / 1024)} MB`));
      return;
    }
    updateCrop(undefined);
    onChange(nextFile);
  }

  function handleInputChange(event: ChangeEvent<HTMLInputElement>) {
    selectFile(event.target.files?.[0]);
    event.target.value = '';
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);
    if (!isDisabled) selectFile(event.dataTransfer.files?.[0]);
  }

  const hasImage = Boolean(file || existingPreviewUrl);

  return (
    <section className={cn('space-y-3', className)}>
      <div>
        <h3 className='text-base font-medium text-foreground'>{label}</h3>
        <p className='mt-1 text-sm text-muted-foreground'>{description}</p>
      </div>
      <div
        className={cn(
          'rounded-md border border-dashed border-border bg-muted/20 p-4 transition-colors',
          isDragging && 'border-primary bg-primary/5',
        )}
        onDragLeave={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setIsDragging(false);
        }}
        onDragOver={(event) => {
          event.preventDefault();
          if (!isDisabled) {
            event.dataTransfer.dropEffect = 'copy';
            setIsDragging(true);
          }
        }}
        onDrop={handleDrop}
      >
        <Input
          ref={inputRef}
          accept={IMAGE_MIME_TYPES.join(',')}
          aria-label={label}
          className='hidden'
          disabled={isDisabled}
          name={variant === 'avatar' ? 'avatar_image' : 'banner_image'}
          type='file'
          onChange={handleInputChange}
        />

        <div className='grid gap-4 sm:grid-cols-[minmax(0,14rem)_1fr] sm:items-start'>
          <div
            className={cn(
              'relative flex min-h-32 items-center justify-center overflow-hidden border border-border bg-muted',
              variant === 'avatar' ? 'mx-auto aspect-square w-32 rounded-full sm:mx-0' : 'aspect-[8/3] w-full rounded-md',
            )}
          >
            {file && objectUrl && variant === 'banner' ? (
              <BannerCropPreview
                aspectRatio={aspectRatio}
                disabled={isDisabled}
                file={file}
                initialCrop={crop}
                src={objectUrl}
                onCropChange={(_, nextCrop) => updateCrop(nextCrop)}
              />
            ) : previewUrl ? (
              <ImageWithLoader
                fill
                unoptimized
                alt=''
                className='object-cover'
                sizes={variant === 'avatar' ? '128px' : '(min-width: 640px) 224px, 100vw'}
                src={previewUrl}
                onLoad={(event) => {
                  if (file && variant === 'avatar' && !crop) {
                    const { naturalHeight, naturalWidth } = event.currentTarget;
                    updateCrop(
                      calculateImageCrop(
                        naturalWidth,
                        naturalHeight,
                        1,
                        naturalWidth / 2,
                        naturalHeight / 2,
                        aspectRatio,
                      ),
                    );
                  }
                }}
              />
            ) : (
              <ImageIcon aria-hidden='true' className='size-7 text-muted-foreground' />
            )}
          </div>

          <div className='min-w-0 space-y-3'>
            <div className='flex flex-wrap gap-2'>
              <Button disabled={isDisabled} type='button' variant='outline' onClick={() => inputRef.current?.click()}>
                <Upload aria-hidden='true' className='size-4' />
                {hasImage ? copy.change : copy.select}
              </Button>
              {file && variant === 'avatar' ? (
                <ImageRepositionDialog
                  aspectRatio={aspectRatio}
                  disabled={isDisabled}
                  file={file}
                  shape={shape}
                  value={crop}
                  onDone={(nextCrop, preview) => updateCrop(nextCrop, preview)}
                />
              ) : null}
              {file ? (
                <Button
                  aria-label={copy.remove}
                  disabled={isDisabled}
                  size='icon'
                  title={copy.remove}
                  type='button'
                  variant='ghost'
                  onClick={() => {
                    onChange(null);
                    updateCrop(undefined);
                    setError(null);
                  }}
                >
                  <Trash2 aria-hidden='true' className='size-4' />
                </Button>
              ) : null}
            </div>
            <p className='text-xs text-muted-foreground'>{copy.drag}</p>
            <p className='truncate text-sm text-muted-foreground'>
              {file?.name ?? (existingPreviewUrl ? copy.current : '')}
            </p>
            {processing ? (
              <div className='space-y-1'>
                <Progress value={65} />
                <p className='text-xs text-muted-foreground'>{processingText}</p>
              </div>
            ) : null}
          </div>
        </div>
      </div>
      {error ? (
        <p className='text-sm font-medium text-destructive' role='alert'>
          {error}
        </p>
      ) : null}
    </section>
  );
}
