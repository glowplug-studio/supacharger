/** Rectangle in integer pixels of the source after EXIF orientation, before resizing. */
export type ImageCrop = Readonly<{ x: number; y: number; width: number; height: number }>;

export function validateImageCrop(crop: ImageCrop, sourceWidth: number, sourceHeight: number) {
  if (
    !crop ||
    ![crop.x, crop.y, crop.width, crop.height].every(Number.isSafeInteger) ||
    crop.x < 0 || crop.y < 0 || crop.width < 1 || crop.height < 1 ||
    crop.width > sourceWidth || crop.height > sourceHeight ||
    crop.x > sourceWidth - crop.width || crop.y > sourceHeight - crop.height
  ) {
    throw new RangeError('Crop must be a positive integer rectangle inside the oriented source image.');
  }
}

export type ImageOutputFormat = 'jpeg' | 'png';
export type ImageResizeFit = 'cover' | 'inside';
export type ImageVisibility = 'private' | 'public';

export type ImageUploadTarget = Readonly<{
  bucket: string;
  cacheControl?: string;
  filenamePrefix: string;
  fit: ImageResizeFit;
  maxHeight?: number;
  maxInputBytes?: number;
  /** null disables the decoded-pixel cap; omitted retains the default. */
  maxInputPixels?: number | null;
  minInputWidth?: number;
  minInputHeight?: number;
  maxWidth?: number;
  outputFormat: ImageOutputFormat;
  pathPrefix: string;
  pngCompressionPercent?: number;
  qualityPercent?: number;
  signedUrlSeconds?: number;
  visibility: ImageVisibility;
}>;

export type ImageUploadTargets = Readonly<Record<string, ImageUploadTarget>>;

const identifierPattern = /^[a-z0-9][a-z0-9_-]*$/;
const pathSegmentPattern = /^[a-zA-Z0-9][a-zA-Z0-9._-]*$/;
const maximumDestinationLength = 256;

function requireIntegerInRange(
  value: number | undefined,
  minimum: number,
  maximum: number,
  field: string,
  targetName: string,
) {
  if (value === undefined) return;

  if (!Number.isInteger(value) || value < minimum || value > maximum) {
    throw new Error(`${targetName}.${field} must be an integer from ${minimum} to ${maximum}.`);
  }
}

function validatePathPrefix(pathPrefix: string, targetName: string) {
  if (pathPrefix.startsWith('/') || pathPrefix.endsWith('/')) {
    throw new Error(`${targetName}.pathPrefix must not start or end with a slash.`);
  }

  if (!pathPrefix) return;

  const segments = pathPrefix.split('/');
  if (segments.some((segment) => !pathSegmentPattern.test(segment) || segment === '.' || segment === '..')) {
    throw new Error(`${targetName}.pathPrefix contains an unsafe path segment.`);
  }
}

export function resolveImageDestination(destination: string | undefined, fallbackPathPrefix: string) {
  const resolvedDestination = destination ?? fallbackPathPrefix;

  if (resolvedDestination.length > maximumDestinationLength) {
    throw new Error(`destination must be ${maximumDestinationLength} characters or less.`);
  }

  validatePathPrefix(resolvedDestination, 'destination');
  return resolvedDestination;
}

export function defineImageUploadTargets<const TTargets extends Record<string, ImageUploadTarget>>(
  targets: TTargets,
): Readonly<TTargets> {
  if (Object.keys(targets).length === 0) {
    throw new Error('At least one image upload target is required.');
  }

  for (const [targetName, target] of Object.entries(targets)) {
    if (!identifierPattern.test(targetName)) {
      throw new Error(`Invalid image upload target name: ${targetName}.`);
    }

    if (!identifierPattern.test(target.bucket)) {
      throw new Error(`${targetName}.bucket must be a safe Storage bucket name.`);
    }

    if (!identifierPattern.test(target.filenamePrefix)) {
      throw new Error(`${targetName}.filenamePrefix must be a safe filename prefix.`);
    }

    validatePathPrefix(target.pathPrefix, targetName);
    requireIntegerInRange(target.maxWidth, 1, 4096, 'maxWidth', targetName);
    requireIntegerInRange(target.maxHeight, 1, 4096, 'maxHeight', targetName);
    requireIntegerInRange(target.maxInputBytes, 1, 10 * 1024 * 1024, 'maxInputBytes', targetName);
    if (target.maxInputPixels !== null) requireIntegerInRange(target.maxInputPixels, 1, 40_000_000, 'maxInputPixels', targetName);
    requireIntegerInRange(target.minInputWidth, 1, 4096, 'minInputWidth', targetName);
    requireIntegerInRange(target.minInputHeight, 1, 4096, 'minInputHeight', targetName);
    requireIntegerInRange(target.qualityPercent, 1, 100, 'qualityPercent', targetName);
    requireIntegerInRange(target.pngCompressionPercent, 0, 100, 'pngCompressionPercent', targetName);
    requireIntegerInRange(target.signedUrlSeconds, 1, 86_400, 'signedUrlSeconds', targetName);

    if (target.fit === 'cover' && (!target.maxWidth || !target.maxHeight)) {
      throw new Error(`${targetName} must set maxWidth and maxHeight when fit is cover.`);
    }

    if (target.visibility === 'public' && target.signedUrlSeconds !== undefined) {
      throw new Error(`${targetName}.signedUrlSeconds is only valid for private targets.`);
    }

    Object.freeze(target);
  }

  return Object.freeze(targets);
}
