import { uploadImage } from '@/supacharger/media/upload-image';

export type { ProjectImageUploadResult } from '@/supacharger/media/upload-image';

export const uploadProjectImage = uploadImage;

export async function uploadProjectImageLocation({
  location,
  ...options
}: Parameters<typeof uploadProjectImage>[0] & {
  location: 'path' | 'public_url' | 'signed_url';
}) {
  const result = await uploadProjectImage(options);
  const value = result[location];
  if (typeof value !== 'string' || !value) {
    throw new Error('The processed image location was not returned.');
  }
  return value;
}
