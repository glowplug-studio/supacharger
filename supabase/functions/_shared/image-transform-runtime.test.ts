/// <reference lib="deno.ns" />

import { assert, assertEquals, assertRejects } from 'jsr:@std/assert@1.0.14';
import { ImageMagick, MagickFormat } from 'npm:@imagemagick/magick-wasm@0.0.42';

import { parseImageUploadRequest } from '../process-image-upload/request.ts';

import type { ImageUploadTarget } from './image-target-contract.ts';
import { ImageTransformError, transformAndStoreImage } from './image-transform.ts';

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

const cropTarget: ImageUploadTarget = {
  bucket: 'user-avatars', filenamePrefix: 'header', fit: 'inside', maxWidth: 1024,
  outputFormat: 'png', pathPrefix: 'headers', visibility: 'private',
};

function patternedSource(width = 8, height = 8, format: MagickFormat = MagickFormat.Png) {
  const pixels = Array.from({ length: width * height }, (_, index) =>
    `${(index % width) * 30} ${Math.floor(index / width) * 30} 0`).join(' ');
  const ppm = new TextEncoder().encode(`P3\n${width} ${height}\n255\n${pixels}`);
  return ImageMagick.read(ppm, (image) => image.write(format, (bytes) => Uint8Array.from(bytes)));
}

Deno.test('crops the requested off-centre pixels before resizing, without upscaling', async () => {
  const storage = createStorageClient();
  const result = await transformAndStoreImage({
    crop: { x: 2, y: 5, width: 6, height: 2 },
    file: new File([patternedSource()], 'source.png', { type: 'image/png' }),
    supabase: storage.client as never, target: cropTarget, userId: 'test-user',
  });
  assertEquals([result.width, result.height], [6, 2]);
  ImageMagick.read(storage.getUpload().bytes, (image) => {
    image.getPixels((pixels) => {
      assertEquals(Array.from(pixels.getPixel(0, 0)).slice(0, 3), [60, 150, 0]);
      assertEquals(Array.from(pixels.getPixel(5, 1)).slice(0, 3), [210, 180, 0]);
    });
  });
});

Deno.test('applies the target inside and cover resize policy after the selected crop', async () => {
  for (const fit of ['inside', 'cover'] as const) {
    const storage = createStorageClient();
    const result = await transformAndStoreImage({
      crop: { x: 2, y: 2, width: 6, height: 6 },
      file: new File([patternedSource()], 'source.png', { type: 'image/png' }),
      supabase: storage.client as never,
      target: { ...cropTarget, fit, maxWidth: 4, maxHeight: 2 }, userId: 'test-user',
    });
    assertEquals([result.width, result.height], fit === 'cover' ? [4, 2] : [2, 2]);
  }
});

Deno.test('omitting the crop preserves the complete image for inside targets', async () => {
  const storage = createStorageClient();
  const result = await transformAndStoreImage({
    file: new File([patternedSource()], 'source.png', { type: 'image/png' }),
    supabase: storage.client as never, target: cropTarget, userId: 'test-user',
  });
  assertEquals([result.width, result.height], [8, 8]);
});

Deno.test('rejects crops outside the source before any Storage operation', async () => {
  const storage = createStorageClient();
  await assertRejects(() => transformAndStoreImage({
    crop: { x: 7, y: 0, width: 2, height: 2 },
    file: new File([patternedSource()], 'source.png', { type: 'image/png' }),
    supabase: storage.client as never, target: cropTarget, userId: 'test-user',
  }), ImageTransformError, 'inside the oriented source image');
  assertEquals(storage.getUpload().path, '');
});

Deno.test('checks the complete decoded pixel limit before cropping', async () => {
  const storage = createStorageClient();
  await assertRejects(() => transformAndStoreImage({
    crop: { x: 0, y: 0, width: 1, height: 1 },
    file: new File([patternedSource()], 'source.png', { type: 'image/png' }),
    supabase: storage.client as never,
    target: { ...cropTarget, maxInputPixels: 63 }, userId: 'test-user',
  }), ImageTransformError, 'decoded image dimensions');
  assertEquals(storage.getUpload().path, '');
});

Deno.test('uses EXIF-oriented coordinates for a rotated JPEG', async () => {
  const jpeg = patternedSource(8, 4, MagickFormat.Jpeg);
  // JPEG APP1: Exif little-endian TIFF, one SHORT orientation tag set to 6 (90° clockwise).
  const exif = Uint8Array.from([
    0xff, 0xe1, 0, 34, 69, 120, 105, 102, 0, 0,
    73, 73, 42, 0, 8, 0, 0, 0, 1, 0,
    0x12, 1, 3, 0, 1, 0, 0, 0, 6, 0, 0, 0, 0, 0, 0, 0,
  ]);
  const oriented = new Uint8Array(jpeg.length + exif.length);
  oriented.set(jpeg.slice(0, 2)); oriented.set(exif, 2); oriented.set(jpeg.slice(2), 2 + exif.length);
  const storage = createStorageClient();
  const result = await transformAndStoreImage({
    crop: { x: 0, y: 4, width: 4, height: 4 },
    file: new File([oriented], 'rotated.jpg', { type: 'image/jpeg' }),
    supabase: storage.client as never, target: cropTarget, userId: 'test-user',
  });
  assertEquals([result.width, result.height], [4, 4]);
  ImageMagick.read(storage.getUpload().bytes, (image) => {
    const pixel = image.getPixels((pixels) => Array.from(pixels.getPixel(0, 0)));
    assert(Math.abs(pixel[0] - 120) < 20 && Math.abs(pixel[1] - 90) < 20);
  });
});

function uploadForm() {
  const form = new FormData();
  form.set('file', new File([transparentPixel], 'source.png', { type: 'image/png' }));
  form.set('target', 'profile_header');
  return form;
}

Deno.test('parses optional multipart crop JSON with strict safe integer coordinates', () => {
  const form = uploadForm();
  assertEquals(parseImageUploadRequest(form)?.crop, undefined);
  const crop = { x: 0, y: 250, width: 1000, height: 375 };
  form.set('crop', JSON.stringify(crop));
  assertEquals(parseImageUploadRequest(form)?.crop, crop);
  for (const value of [
    '', '{', 'null', '[]', 'true', '42', '{}',
    '{"x":"0","y":0,"width":1,"height":1}',
    '{"x":0,"y":0,"width":1,"height":1,"quality":80}',
    '{"x":0,"y":0,"width":1e309,"height":1}',
    JSON.stringify({ ...crop, x: -1 }), JSON.stringify({ ...crop, x: 0.1 }),
    JSON.stringify({ ...crop, width: 0 }), JSON.stringify({ ...crop, height: -1 }),
    JSON.stringify({ ...crop, y: Number.MAX_SAFE_INTEGER + 1 }), ' '.repeat(257),
  ]) {
    form.set('crop', value);
    assertEquals(parseImageUploadRequest(form), null, value);
  }
  form.set('crop', new File(['{}'], 'crop.json'));
  assertEquals(parseImageUploadRequest(form), null);
});

Deno.test('rejects duplicate, missing, unknown and unsafe multipart fields', () => {
  for (const field of ['crop', 'destination', 'file', 'target']) {
    const form = uploadForm();
    form.append(field, 'duplicate'); form.append(field, 'duplicate');
    assertEquals(parseImageUploadRequest(form), null);
  }
  for (const field of ['file', 'target']) {
    const form = uploadForm(); form.delete(field);
    assertEquals(parseImageUploadRequest(form), null);
  }
  for (const field of ['bucket', 'user_id', 'width', 'height', 'quality']) {
    const form = uploadForm(); form.set(field, 'override');
    assertEquals(parseImageUploadRequest(form), null);
  }
  const form = uploadForm(); form.set('destination', '../outside');
  assertEquals(parseImageUploadRequest(form), null);
});
