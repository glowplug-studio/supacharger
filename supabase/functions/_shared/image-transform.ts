/// <reference lib="deno.ns" />

import type { IMagickImage } from 'npm:@imagemagick/magick-wasm@0.0.42';
import {
  AlphaAction,
  Gravity,
  ImageMagick,
  initializeImageMagick,
  MagickColor,
  MagickFormat,
  MagickGeometry,
} from 'npm:@imagemagick/magick-wasm@0.0.42';
import type { SupabaseClient } from 'npm:@supabase/supabase-js@2.112.3';

import { type ImageCrop, type ImageUploadTarget,resolveImageDestination, validateImageCrop } from './image-target-contract.ts';

const defaultMaxInputBytes = 5 * 1024 * 1024;
const defaultMaxInputPixels = 25_000_000;
const supportedInputFormats = new Set<string>([MagickFormat.Jpeg, MagickFormat.Png, MagickFormat.WebP]);
const supportedInputMimeTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);

const wasmBytes = await Deno.readFile(new URL('../process-image-upload/magick.wasm', import.meta.url));
await initializeImageMagick(wasmBytes);

export type ImageTransformErrorCode =
  'input_too_small' | 'invalid_crop' | 'decode_failed' | 'input_too_large' | 'pixel_limit_exceeded' | 'storage_failed' | 'unsupported_input';

export class ImageTransformError extends Error {
  constructor(
    readonly code: ImageTransformErrorCode,
    message: string,
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = 'ImageTransformError';
  }
}

type TransformResult = {
  bytes: Uint8Array;
  height: number;
  width: number;
};

export type StoredImageResult = {
  bucket: string;
  bytes: number;
  contentType: 'image/jpeg' | 'image/png';
  height: number;
  path: string;
  publicUrl?: string;
  signedUrl?: string;
  signedUrlExpiresIn?: number;
  width: number;
};

function resizeInside(image: IMagickImage, target: ImageUploadTarget) {
  const widthScale = target.maxWidth ? target.maxWidth / image.width : Number.POSITIVE_INFINITY;
  const heightScale = target.maxHeight ? target.maxHeight / image.height : Number.POSITIVE_INFINITY;
  const scale = Math.min(1, widthScale, heightScale);

  if (scale >= 1) return;

  image.resize(Math.max(1, Math.round(image.width * scale)), Math.max(1, Math.round(image.height * scale)));
}

function resizeCover(image: IMagickImage, target: ImageUploadTarget) {
  const targetWidth = target.maxWidth!;
  const targetHeight = target.maxHeight!;
  const targetRatio = targetWidth / targetHeight;
  const sourceRatio = image.width / image.height;

  if (sourceRatio > targetRatio) {
    image.crop(Math.max(1, Math.round(image.height * targetRatio)), image.height, Gravity.Center);
  } else if (sourceRatio < targetRatio) {
    image.crop(image.width, Math.max(1, Math.round(image.width / targetRatio)), Gravity.Center);
  }

  const scale = Math.min(1, targetWidth / image.width, targetHeight / image.height);
  if (scale < 1) {
    image.resize(Math.max(1, Math.round(image.width * scale)), Math.max(1, Math.round(image.height * scale)));
  }
}

function transformImage(source: Uint8Array, target: ImageUploadTarget, crop?: ImageCrop): TransformResult {
  try {
    return ImageMagick.read(source, (image) => {
      if (!supportedInputFormats.has(image.format)) {
        throw new ImageTransformError('unsupported_input', 'Only JPEG, PNG, and WebP images are supported.');
      }

      image.autoOrient();

      const pixelCount = image.width * image.height;
      if (!Number.isSafeInteger(pixelCount) || (target.maxInputPixels !== null && pixelCount > (target.maxInputPixels ?? defaultMaxInputPixels))) {
        throw new ImageTransformError('pixel_limit_exceeded', 'The decoded image dimensions are too large.');
      }

      if (crop !== undefined) {
        try {
          validateImageCrop(crop, image.width, image.height);
        } catch (cause) {
          throw new ImageTransformError('invalid_crop', 'Crop must be a positive integer rectangle inside the oriented source image.', { cause });
        }
        image.resetPage();
        image.crop(new MagickGeometry(crop.x, crop.y, crop.width, crop.height));
        image.resetPage();
      }

      // Check the oriented source (or selected crop), before output resizing.
      if (image.width < (target.minInputWidth ?? 1) || image.height < (target.minInputHeight ?? 1)) {
        throw new ImageTransformError('input_too_small', `Image must be at least ${target.minInputWidth ?? 1} × ${target.minInputHeight ?? 1}px.`);
      }

      if (target.fit === 'cover') {
        resizeCover(image, target);
      } else {
        resizeInside(image, target);
      }

      image.strip();

      const outputFormat = target.outputFormat === 'png' ? MagickFormat.Png : MagickFormat.Jpeg;
      if (target.outputFormat === 'png') {
        const compressionLevel = Math.round(((target.pngCompressionPercent ?? 75) / 100) * 9);
        image.settings.setDefine(MagickFormat.Png, 'compression-level', compressionLevel);
      } else {
        image.backgroundColor = new MagickColor('white');
        image.alpha(AlphaAction.Remove);
        image.quality = target.qualityPercent ?? 80;
      }

      return {
        bytes: image.write(outputFormat, (data) => Uint8Array.from(data)),
        height: image.height,
        width: image.width,
      };
    });
  } catch (error) {
    if (error instanceof ImageTransformError) throw error;
    throw new ImageTransformError('decode_failed', 'The image could not be decoded.', { cause: error });
  }
}

export function supportsImageMimeType(mimeType: string) {
  return supportedInputMimeTypes.has(mimeType.toLowerCase());
}

export async function transformAndStoreImage({
  crop,
  destination,
  file,
  supabase,
  target,
  userId,
}: {
  crop?: ImageCrop;
  destination?: string;
  file: File;
  supabase: SupabaseClient;
  target: ImageUploadTarget;
  userId: string;
}): Promise<StoredImageResult> {
  if (!supportsImageMimeType(file.type)) {
    throw new ImageTransformError('unsupported_input', 'Only JPEG, PNG, and WebP images are supported.');
  }

  if (file.size > (target.maxInputBytes ?? defaultMaxInputBytes)) {
    throw new ImageTransformError('input_too_large', 'The source image is too large.');
  }

  const transformed = transformImage(new Uint8Array(await file.arrayBuffer()), target, crop);
  const extension = target.outputFormat === 'png' ? 'png' : 'jpg';
  const contentType = target.outputFormat === 'png' ? 'image/png' : 'image/jpeg';
  const filename = `${target.filenamePrefix}-${crypto.randomUUID()}.${extension}`;
  const destinationPath = resolveImageDestination(destination, target.pathPrefix);
  const path = [userId, destinationPath, filename].filter(Boolean).join('/');

  const { error: uploadError } = await supabase.storage.from(target.bucket).upload(path, transformed.bytes, {
    cacheControl: target.cacheControl ?? '31536000',
    contentType,
    upsert: false,
  });

  if (uploadError) {
    throw new ImageTransformError('storage_failed', 'The transformed image could not be stored.', {
      cause: uploadError,
    });
  }

  const result: StoredImageResult = {
    bucket: target.bucket,
    bytes: transformed.bytes.byteLength,
    contentType,
    height: transformed.height,
    path,
    width: transformed.width,
  };

  if (target.visibility === 'public') {
    const { data } = supabase.storage.from(target.bucket).getPublicUrl(path);
    result.publicUrl = data.publicUrl;
    return result;
  }

  if (target.signedUrlSeconds) {
    const { data, error } = await supabase.storage.from(target.bucket).createSignedUrl(path, target.signedUrlSeconds);
    if (error) {
      throw new ImageTransformError('storage_failed', 'The image was stored but its signed URL could not be created.', {
        cause: error,
      });
    }

    result.signedUrl = data.signedUrl;
    result.signedUrlExpiresIn = target.signedUrlSeconds;
  }

  return result;
}
