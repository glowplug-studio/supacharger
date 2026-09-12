import { createClient } from '@/lib/supabase/client';

import type { ImageCrop } from '../../../../supabase/functions/_shared/image-target-contract';

export type ProjectImageUploadResult = {
  bucket: string;
  bytes: number;
  content_type: string;
  height: number;
  path: string;
  public_url?: string | null;
  signed_url?: string | null;
  target: string;
  width: number;
};

export async function uploadProjectImage({
  crop,
  destination,
  file,
  target,
}: {
  crop?: ImageCrop;
  destination?: string;
  file: File;
  target: string;
}) {
  const formData = new FormData();
  formData.set('file', file);
  formData.set('target', target);
  if (destination) formData.set('destination', destination);
  if (crop) formData.set('crop', JSON.stringify(crop));

  const supabase = createClient();
  const { data, error } = await supabase.functions.invoke<ProjectImageUploadResult & { error?: string }>(
    'process-image-upload',
    { body: formData },
  );

  if (error || data?.error || !data?.path) {
    throw new Error(data?.error || 'The image upload failed.');
  }

  return data;
}

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
