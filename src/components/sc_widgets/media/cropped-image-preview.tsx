'use client';

import { useState } from 'react';
import { UserRound } from 'lucide-react';

import { cn } from '@/utils/cn';

import type { ImageCrop } from '../../../../supabase/functions/_shared/image-target-contract';

import { FullSizeImageWithLoader } from './image-with-loader';

export function CroppedImagePreview({
  alt,
  className,
  crop,
  fallback,
  shape = 'rectangle',
  src,
}: {
  alt: string;
  className?: string;
  crop?: ImageCrop;
  fallback?: React.ReactNode;
  shape?: 'circle' | 'rectangle';
  src?: string | null;
}) {
  const [dimensions, setDimensions] = useState<{ height: number; width: number } | null>(null);

  return (
    <div className={cn('relative overflow-hidden bg-muted', shape === 'circle' && 'rounded-full', className)}>
      {src ? (
        <FullSizeImageWithLoader
          alt={alt}
          className='absolute max-w-none'
          src={src}
          style={
            crop && dimensions
              ? {
                  height: `${(dimensions.height / crop.height) * 100}%`,
                  left: `${-(crop.x / crop.width) * 100}%`,
                  top: `${-(crop.y / crop.height) * 100}%`,
                  width: `${(dimensions.width / crop.width) * 100}%`,
                }
              : { height: '100%', inset: 0, objectFit: 'cover', width: '100%' }
          }
          onLoad={(event) => {
            setDimensions({ height: event.currentTarget.naturalHeight, width: event.currentTarget.naturalWidth });
          }}
        />
      ) : (
        fallback ?? (
          <span className='absolute inset-0 flex items-center justify-center text-muted-foreground'>
            <UserRound aria-hidden='true' className='size-1/3' />
          </span>
        )
      )}
    </div>
  );
}
