import type { ImageCrop } from '../../../../supabase/functions/_shared/image-target-contract';

export function calculateImageCrop(
  width: number,
  height: number,
  zoom: number,
  centreX: number,
  centreY: number,
  aspectRatio = 1,
): ImageCrop {
  if (
    ![width, height].every((value) => Number.isSafeInteger(value) && value > 0) ||
    ![zoom, centreX, centreY, aspectRatio].every(Number.isFinite) ||
    zoom < 1 ||
    zoom > 4 ||
    aspectRatio <= 0
  ) {
    throw new RangeError('Invalid image crop.');
  }

  const cropWidth = Math.max(1, Math.round(Math.min(width, height * aspectRatio) / zoom));
  const cropHeight = Math.min(height, Math.max(1, Math.round(cropWidth / aspectRatio)));

  return {
    x: Math.round(Math.max(0, Math.min(width - cropWidth, centreX - cropWidth / 2))),
    y: Math.round(Math.max(0, Math.min(height - cropHeight, centreY - cropHeight / 2))),
    width: cropWidth,
    height: cropHeight,
  };
}
