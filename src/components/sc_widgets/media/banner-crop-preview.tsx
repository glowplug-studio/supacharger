'use client';

import { useRef, useState } from 'react';
import { ArrowUpDown } from 'lucide-react';

import { Button } from '@/components/ui/button';

import type { ImageCrop } from '../../../../supabase/functions/_shared/image-target-contract';

import { calculateImageCrop } from './image-crop';
import { ImageWithLoader } from './image-with-loader';

export function BannerCropPreview({
  aspectRatio = 4,
  disabled,
  dragLabel = 'Drag vertically to position',
  failedLabel = 'The image preview could not be loaded.',
  file,
  initialCrop,
  onCropChange,
  src,
}: {
  aspectRatio?: number;
  disabled: boolean;
  dragLabel?: string;
  failedLabel?: string;
  file: File;
  initialCrop?: ImageCrop;
  onCropChange: (file: File, crop: ImageCrop) => void;
  src: string;
}) {
  const [dimensions, setDimensions] = useState<{ height: number; width: number } | null>(null);
  const [position, setPosition] = useState(0.5);
  const [failed, setFailed] = useState(false);
  const drag = useRef<{ overflow: number; position: number; y: number } | null>(null);

  function sourceCrop(width: number, height: number, verticalPosition: number) {
    const base = calculateImageCrop(width, height, 1, width / 2, height / 2, aspectRatio);
    return { ...base, y: Math.round((height - base.height) * verticalPosition) };
  }

  function move(next: number) {
    if (!dimensions) return;
    const clamped = Math.max(0, Math.min(1, next));
    setPosition(clamped);
    onCropChange(file, sourceCrop(dimensions.width, dimensions.height, clamped));
  }

  const canDrag = Boolean(dimensions && dimensions.height > dimensions.width / aspectRatio);

  return (
    <>
      <ImageWithLoader
        fill
        unoptimized
        alt=''
        className='select-none object-cover'
        draggable={false}
        sizes='100vw'
        src={src}
        style={{ objectPosition: `50% ${position * 100}%` }}
        onError={() => setFailed(true)}
        onLoad={(event) => {
          const { naturalHeight: height, naturalWidth: width } = event.currentTarget;
          setDimensions({ height, width });
          const range = height - sourceCrop(width, height, 0).height;
          const nextPosition = initialCrop && range > 0 ? Math.max(0, Math.min(1, initialCrop.y / range)) : position;
          setPosition(nextPosition);
          onCropChange(file, sourceCrop(width, height, nextPosition));
        }}
      />
      <Button
        aria-label={dragLabel}
        className='absolute inset-0 h-full w-full touch-none rounded-none bg-transparent p-0 hover:bg-background/10 focus-visible:ring-inset active:bg-background/10 disabled:opacity-100 dark:hover:bg-background/10 dark:active:bg-background/10'
        disabled={disabled || !canDrag}
        type='button'
        variant='ghost'
        onKeyDown={(event) => {
          if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
            event.preventDefault();
            move(position + (event.key === 'ArrowUp' ? -0.05 : 0.05));
          }
        }}
        onLostPointerCapture={() => {
          drag.current = null;
        }}
        onPointerCancel={() => {
          drag.current = null;
        }}
        onPointerDown={(event) => {
          if (!dimensions || event.button !== 0) return;
          const crop = sourceCrop(dimensions.width, dimensions.height, position);
          drag.current = {
            overflow: ((dimensions.height - crop.height) * event.currentTarget.clientWidth) / crop.width,
            position,
            y: event.clientY,
          };
          event.currentTarget.setPointerCapture(event.pointerId);
        }}
        onPointerMove={(event) => {
          if (drag.current && drag.current.overflow > 0) {
            move(drag.current.position - (event.clientY - drag.current.y) / drag.current.overflow);
          }
        }}
        onPointerUp={(event) => {
          drag.current = null;
          if (event.currentTarget.hasPointerCapture(event.pointerId)) {
            event.currentTarget.releasePointerCapture(event.pointerId);
          }
        }}
      >
        {canDrag ? (
          <span className='pointer-events-none flex items-center gap-2 rounded-md border border-border bg-background/85 px-4 py-2 text-sm text-foreground shadow-sm backdrop-blur-sm motion-safe:animate-pulse'>
            <ArrowUpDown aria-hidden='true' className='size-4 shrink-0' />
            {dragLabel}
          </span>
        ) : null}
      </Button>
      {failed ? (
        <p className='absolute inset-x-4 bottom-4 rounded-md bg-background/90 p-3 text-sm text-foreground' role='alert'>
          {failedLabel}
        </p>
      ) : null}
    </>
  );
}
