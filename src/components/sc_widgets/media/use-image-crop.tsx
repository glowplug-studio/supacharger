'use client';

import { type ReactNode, useState } from 'react';

import type { ImageCrop } from '../../../../supabase/functions/_shared/image-target-contract';

import { BannerCropPreview } from './banner-crop-preview';
import { ImageRepositionDialog } from './image-reposition-dialog';
import { useObjectUrl } from './use-object-url';

export type ImageCropControls = {
  action: ReactNode;
  banner: ReactNode;
  crop?: ImageCrop;
  preview?: string;
};

export function useImageCrop(
  file: File | null,
  aspectRatio: number,
  shape: 'circle' | 'rectangle',
  disabled: boolean,
): ImageCropControls {
  const src = useObjectUrl(file);
  const [selection, setSelection] = useState<{ crop: ImageCrop; file: File; preview?: string } | null>(null);
  const current = selection?.file === file ? selection : null;

  return {
    action: file ? (
      <ImageRepositionDialog
        aspectRatio={aspectRatio}
        disabled={disabled}
        file={file}
        shape={shape}
        value={current?.crop}
        onDone={(crop, preview) => setSelection({ crop, file, preview })}
      />
    ) : null,
    banner:
      file && src ? (
        <BannerCropPreview
          key={src}
          aspectRatio={aspectRatio}
          disabled={disabled}
          file={file}
          initialCrop={current?.crop}
          src={src}
          onCropChange={(source, crop) => setSelection({ crop, file: source })}
        />
      ) : null,
    crop: current?.crop,
    preview: current?.preview,
  };
}
