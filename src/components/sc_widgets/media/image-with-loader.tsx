'use client';

import { type ComponentProps, type ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import Image, { type ImageProps } from 'next/image';

import ImageLoader from '@/assets/svgr/ui/image-loader.svg';
import { cn } from '@/utils/cn';

type LoadStatus = 'loading' | 'loaded' | 'failed';

function ImagePlaceholder({ className, fallback }: { className?: string; fallback?: ReactNode }) {
  const containerRef = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const svg = containerRef.current?.querySelector('svg');
    if (reduceMotion.matches && svg && 'pauseAnimations' in svg) {
      (svg as SVGSVGElement).pauseAnimations();
    }
  }, []);

  return (
    <span
      aria-hidden='true'
      className={cn('pointer-events-none absolute inset-0 flex items-center justify-center text-muted-foreground', className)}
      ref={containerRef}
    >
      {fallback ?? <ImageLoader className='size-[50px] shrink-0' />}
    </span>
  );
}

function useDecodedImage() {
  const [status, setStatus] = useState<LoadStatus>('loading');
  const currentImage = useRef<HTMLImageElement | null>(null);

  const reveal = useCallback(async (image: HTMLImageElement) => {
    try {
      await image.decode();
    } catch {
      // A failed decode must not leave an indefinite loading indicator.
    }
    if (currentImage.current === image) setStatus(image.naturalWidth > 0 ? 'loaded' : 'failed');
  }, []);

  const imageRef = useCallback(
    (image: HTMLImageElement | null) => {
      currentImage.current = image;
      if (image?.complete) void reveal(image);
    },
    [reveal],
  );

  return { imageRef, pending: status === 'loading', reveal, setStatus, status };
}

export type ImageWithLoaderProps = ImageProps & {
  loaderClassName?: string;
  loaderFallback?: ReactNode;
  showLoader?: boolean;
};

function LoadingImage({
  alt,
  className,
  loaderClassName,
  loaderFallback,
  onError,
  onLoad,
  showLoader,
  ...props
}: ImageWithLoaderProps) {
  const { imageRef, pending, reveal, setStatus, status } = useDecodedImage();

  return (
    <>
      {pending && (showLoader ?? props.fill === true) ? (
        <ImagePlaceholder className={loaderClassName} fallback={loaderFallback} />
      ) : null}
      <Image
        {...props}
        alt={alt}
        className={cn(
          'transition-opacity duration-300 motion-reduce:transition-none',
          className,
          pending ? 'opacity-0' : status === 'loaded' ? 'opacity-100' : 'opacity-0',
        )}
        ref={imageRef}
        onError={(event) => {
          setStatus('failed');
          onError?.(event);
        }}
        onLoad={(event) => {
          void reveal(event.currentTarget);
          onLoad?.(event);
        }}
      />
    </>
  );
}

export function ImageWithLoader(props: ImageWithLoaderProps) {
  const source = typeof props.src === 'string' ? props.src : 'default' in props.src ? props.src.default.src : props.src.src;
  return <LoadingImage key={source} {...props} />;
}

export type FullSizeImageWithLoaderProps = Omit<ComponentProps<'img'>, 'src'> & {
  loaderClassName?: string;
  src: string;
};

function NativeLoadingImage({ alt, className, loaderClassName, onError, onLoad, ...props }: FullSizeImageWithLoaderProps) {
  const { imageRef, pending, reveal, setStatus, status } = useDecodedImage();

  return (
    <>
      {pending ? <ImagePlaceholder className={loaderClassName} /> : null}
      {/* Native sizing is required here because the source dimensions are unknown. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        {...props}
        alt={alt}
        className={cn(
          'transition-opacity duration-300 motion-reduce:transition-none',
          className,
          pending ? 'opacity-0' : status === 'loaded' ? 'opacity-100' : 'opacity-0',
        )}
        ref={imageRef}
        onError={(event) => {
          setStatus('failed');
          onError?.(event);
        }}
        onLoad={(event) => {
          void reveal(event.currentTarget);
          onLoad?.(event);
        }}
      />
    </>
  );
}

export function FullSizeImageWithLoader(props: FullSizeImageWithLoaderProps) {
  return <NativeLoadingImage key={props.src} {...props} />;
}
