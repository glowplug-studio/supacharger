import { createClient } from '@/lib/supabase/client';

import type { ImageCrop } from '../../../supabase/functions/_shared/image-target-contract';
import { imageSha256 } from '../../../supabase/functions/process_image_upload/permit-crypto';

export type ProjectImageUploadResult = {
  bucket: string; bytes: number; content_type: string; height: number; path: string;
  public_url?: string | null; signed_url?: string | null; target: string; width: number;
};

export async function uploadImage({ file, ...settings }: { file: File; target: string; destination?: string; crop?: ImageCrop }) {
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
  const { data, error } = await createClient().functions.invoke<ProjectImageUploadResult & { error?: string }>('process_image_upload', { body });
  if (error || data?.error || !data?.path) throw new Error(data?.error || 'The image upload failed.');
  return data;
}
