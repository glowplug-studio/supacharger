/// <reference lib="deno.ns" />

import { assert, assertEquals } from 'jsr:@std/assert@1.0.14';

import type { ImageUploadTarget } from './image-target-contract.ts';
import { transformAndStoreImage } from './image-transform.ts';

const transparentPixel = Uint8Array.from(
  atob(
    'iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAACXBIWXMAAAPoAAAD6AG1e1JrAAAAEUlEQVQImWP4z8DQAMIMMAYAOOgF/Q/eI6wAAAAASUVORK5CYII=',
  ),
  (character) => character.charCodeAt(0),
);

function createStorageClient() {
  let uploadedBytes: Uint8Array<ArrayBufferLike> = new Uint8Array();
  let uploadedPath = '';

  return {
    client: {
      storage: {
        from(bucket: string) {
          return {
            createSignedUrl: async (path: string, expiresIn: number) => ({
              data: { signedUrl: `https://storage.test/${bucket}/${path}?expires=${expiresIn}` },
              error: null,
            }),
            getPublicUrl: (path: string) => ({ data: { publicUrl: `https://storage.test/${bucket}/${path}` } }),
            upload: async (path: string, bytes: Uint8Array) => {
              uploadedBytes = bytes;
              uploadedPath = path;
              return { error: null };
            },
          };
        },
      },
    },
    getUpload: () => ({ bytes: uploadedBytes, path: uploadedPath }),
  };
}

Deno.test('re-encodes an uploaded image as JPEG under the authenticated user path', async () => {
  const storage = createStorageClient();
  const target: ImageUploadTarget = {
    bucket: 'user-avatars',
    filenamePrefix: 'avatar',
    fit: 'cover',
    maxHeight: 300,
    maxWidth: 300,
    outputFormat: 'jpeg',
    pathPrefix: '',
    qualityPercent: 80,
    signedUrlSeconds: 3600,
    visibility: 'private',
  };

  const result = await transformAndStoreImage({
    destination: 'profiles/avatars',
    file: new File([transparentPixel], 'pixel.png', { type: 'image/png' }),
    supabase: storage.client as never,
    target,
    userId: '00000000-0000-4000-8000-000000000001',
  });

  const upload = storage.getUpload();
  assert(upload.path.startsWith('00000000-0000-4000-8000-000000000001/profiles/avatars/avatar-'));
  assert(upload.path.endsWith('.jpg'));
  assertEquals(Array.from(upload.bytes.slice(0, 2)), [0xff, 0xd8]);
  assertEquals(result.contentType, 'image/jpeg');
  assert(result.signedUrl?.includes('expires=3600'));
});

Deno.test('supports a code-owned lossless PNG output target', async () => {
  const storage = createStorageClient();
  const target: ImageUploadTarget = {
    bucket: 'project-images',
    filenamePrefix: 'preview',
    fit: 'inside',
    maxWidth: 1024,
    outputFormat: 'png',
    pathPrefix: 'previews',
    pngCompressionPercent: 80,
    visibility: 'public',
  };

  const result = await transformAndStoreImage({
    file: new File([transparentPixel], 'pixel.png', { type: 'image/png' }),
    supabase: storage.client as never,
    target,
    userId: '00000000-0000-4000-8000-000000000001',
  });

  const upload = storage.getUpload();
  assert(upload.path.includes('/previews/preview-'));
  assert(upload.path.endsWith('.png'));
  assertEquals(Array.from(upload.bytes.slice(0, 8)), [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  assertEquals(result.contentType, 'image/png');
  assert(result.publicUrl?.endsWith(upload.path));
});
