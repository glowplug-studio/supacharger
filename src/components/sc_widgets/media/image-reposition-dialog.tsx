'use client';

import { useId, useRef, useState } from 'react';
import { Move } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';

import type { ImageCrop } from '../../../../supabase/functions/_shared/image-target-contract';

import { calculateImageCrop } from './image-crop';
import { FullSizeImageWithLoader } from './image-with-loader';
import { useObjectUrl } from './use-object-url';

type ImageRepositionCopy = {
  cancel: string;
  circleDescription: string;
  done: string;
  dragLabel: string;
  failed: string;
  rectangleDescription: string;
  reposition: string;
  title: string;
  zoom: string;
};

const defaultCopy: ImageRepositionCopy = {
  cancel: 'Cancel',
  circleDescription: 'Drag and zoom the image inside the circular crop.',
  done: 'Done',
  dragLabel: 'Drag image to reposition it',
  failed: 'The image preview could not be loaded.',
  rectangleDescription: 'Drag and zoom the image inside the crop area.',
  reposition: 'Reposition',
  title: 'Reposition image',
  zoom: 'Zoom',
};

export function ImageRepositionDialog({
  aspectRatio = 1,
  copy = defaultCopy,
  disabled,
  file,
  onDone,
  shape = 'circle',
  value,
}: {
  aspectRatio?: number;
  copy?: ImageRepositionCopy;
  disabled: boolean;
  file: File;
  onDone: (crop: ImageCrop, preview: string) => void;
  shape?: 'circle' | 'rectangle';
  value?: ImageCrop;
}) {
  const zoomId = useId();
  const [open, setOpen] = useState(false);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [failed, setFailed] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [centre, setCentre] = useState({ x: 0, y: 0 });
  const drag = useRef<{ centreX: number; centreY: number; scale: number; x: number; y: number } | null>(null);
  const src = useObjectUrl(file);
  const crop = image
    ? calculateImageCrop(image.naturalWidth, image.naturalHeight, zoom, centre.x, centre.y, aspectRatio)
    : null;

  function move(x: number, y: number, nextZoom = zoom) {
    if (!image) return;
    const next = calculateImageCrop(image.naturalWidth, image.naturalHeight, nextZoom, x, y, aspectRatio);
    setCentre({ x: next.x + next.width / 2, y: next.y + next.height / 2 });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) {
          setImage(null);
          setFailed(false);
        }
      }}
    >
      <DialogTrigger asChild>
        <Button disabled={disabled} size='sm' type='button' variant='outline'>
          <Move aria-hidden='true' className='size-4' />
          {copy.reposition}
        </Button>
      </DialogTrigger>
      <DialogContent className='max-h-[90dvh] overflow-y-auto sm:max-w-lg'>
        <DialogHeader>
          <DialogTitle>{copy.title}</DialogTitle>
          <DialogDescription>
            {shape === 'circle' ? copy.circleDescription : copy.rectangleDescription}
          </DialogDescription>
        </DialogHeader>
        <div
          className='relative mx-auto w-full max-w-[50dvh] overflow-hidden rounded-md bg-muted'
          style={{ aspectRatio }}
        >
          {src ? (
            <FullSizeImageWithLoader
              alt=''
              className='pointer-events-none absolute max-w-none select-none'
              draggable={false}
              src={src}
              style={
                image && crop
                  ? {
                      height: `${(image.naturalHeight / crop.height) * 80}%`,
                      left: `${10 - (crop.x / crop.width) * 80}%`,
                      top: `${10 - (crop.y / crop.height) * 80}%`,
                      width: `${(image.naturalWidth / crop.width) * 80}%`,
                    }
                  : { opacity: 0 }
              }
              onError={() => setFailed(true)}
              onLoad={(event) => {
                const loaded = event.currentTarget;
                setImage(loaded);
                setZoom(
                  value
                    ? Math.min(4, Math.min(loaded.naturalWidth, loaded.naturalHeight * aspectRatio) / value.width)
                    : 1,
                );
                setCentre(
                  value
                    ? { x: value.x + value.width / 2, y: value.y + value.height / 2 }
                    : { x: loaded.naturalWidth / 2, y: loaded.naturalHeight / 2 },
                );
              }}
            />
          ) : null}
          <div
            aria-hidden='true'
            className={`pointer-events-none absolute inset-[10%] border border-foreground/70 ${shape === 'circle' ? 'rounded-full' : 'rounded-md'}`}
          />
          <Button
            aria-label={copy.dragLabel}
            className='absolute inset-0 h-full w-full touch-none rounded-none bg-transparent p-0 hover:bg-transparent focus-visible:ring-inset'
            disabled={!image || failed}
            type='button'
            variant='ghost'
            onKeyDown={(event) => {
              if (!crop || !['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return;
              event.preventDefault();
              const step = crop.width * 0.025;
              move(
                centre.x + (event.key === 'ArrowLeft' ? step : event.key === 'ArrowRight' ? -step : 0),
                centre.y + (event.key === 'ArrowUp' ? step : event.key === 'ArrowDown' ? -step : 0),
              );
            }}
            onLostPointerCapture={() => {
              drag.current = null;
            }}
            onPointerCancel={() => {
              drag.current = null;
            }}
            onPointerDown={(event) => {
              if (!crop || event.button !== 0) return;
              drag.current = {
                centreX: crop.x + crop.width / 2,
                centreY: crop.y + crop.height / 2,
                scale: (event.currentTarget.clientWidth * 0.8) / crop.width,
                x: event.clientX,
                y: event.clientY,
              };
              event.currentTarget.setPointerCapture(event.pointerId);
            }}
            onPointerMove={(event) => {
              const start = drag.current;
              if (start) {
                move(
                  start.centreX - (event.clientX - start.x) / start.scale,
                  start.centreY - (event.clientY - start.y) / start.scale,
                );
              }
            }}
            onPointerUp={(event) => {
              drag.current = null;
              if (event.currentTarget.hasPointerCapture(event.pointerId)) {
                event.currentTarget.releasePointerCapture(event.pointerId);
              }
            }}
          />
        </div>
        {failed ? (
          <p className='text-sm text-destructive' role='alert'>
            {copy.failed}
          </p>
        ) : null}
        <div className='flex items-center gap-4'>
          <Label className='shrink-0' htmlFor={zoomId}>
            {copy.zoom}
          </Label>
          <Slider
            aria-label={copy.zoom}
            disabled={!image || failed}
            id={zoomId}
            max={4}
            min={1}
            step={0.01}
            value={[zoom]}
            onValueChange={([next]) => {
              setZoom(next);
              move(centre.x, centre.y, next);
            }}
          />
          <span className='w-12 shrink-0 text-right text-sm tabular-nums text-muted-foreground'>
            {Math.round(zoom * 100)}%
          </span>
        </div>
        <DialogFooter className='flex-row justify-between sm:justify-between'>
          <Button type='button' variant='outline' onClick={() => setOpen(false)}>
            {copy.cancel}
          </Button>
          <Button
            disabled={!crop || failed}
            type='button'
            onClick={() => {
              if (!crop || !image) return;
              const canvas = document.createElement('canvas');
              canvas.width = 384;
              canvas.height = Math.round(384 / aspectRatio);
              const context = canvas.getContext('2d');
              if (!context) return;
              context.drawImage(
                image,
                crop.x,
                crop.y,
                crop.width,
                crop.height,
                0,
                0,
                canvas.width,
                canvas.height,
              );
              onDone(crop, canvas.toDataURL('image/png'));
              setOpen(false);
            }}
          >
            {copy.done}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
