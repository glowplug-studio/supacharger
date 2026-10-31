import { createClient } from '@/lib/supabase/client';
import { supabaseResourceName } from '@/supacharger/namespace';

import type { ImageCrop } from '../../../supabase/functions/_shared/image-target-contract';
import { imageSha256 } from '../../../supabase/functions/process_image_upload/permit-crypto';

import { type ImageUploadProgress, trackImageUpload } from './image-upload-transport';

export type { ImageUploadProgress } from './image-upload-transport';

export type ProjectImageUploadResult = {
  bucket: string; bytes: number; content_type: string; height: number; path: string;
  public_url?: string | null; signed_url?: string | null; target: string; width: number;
};

export async function uploadImage({ file, onProgress, ...settings }: { file: File; target: string; destination?: string; crop?: ImageCrop; onProgress?: (progress: ImageUploadProgress) => void }) {
  onProgress?.({ phase: 'preparing' });
  const response = await fetch('/api/images/authorise', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...settings, bytes: file.size, mimeType: file.type, sha256: await imageSha256(await file.arrayBuffer()) }),
  });
  if (!response.ok) throw new Error('The image upload could not be authorised.');
  const { permit, signature } = await response.json();
  const body = new FormData();
  body.set('file', file);
  body.set('permit', permit);
  body.set('signature', signature);
  const stopTracking = onProgress ? trackImageUpload(body, onProgress) : undefined;
  try {
    const { data, error } = await createClient().functions.invoke<ProjectImageUploadResult & { error?: string }>(supabaseResourceName('process_image_upload', 'function'), { body });
    if (error || data?.error || !data?.path) throw new Error(data?.error || 'The image upload failed.');
    onProgress?.({ phase: 'completed' });
    return data;
  } finally {
    stopTracking?.();
  }
}
