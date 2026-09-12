import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import test from 'node:test';

import {
  defineImageUploadTargets,
  resolveImageDestination,
  validateImageCrop,
} from '../supabase/functions/_shared/image-target-contract.ts';
import { imageUploadTargets } from '../supabase/functions/_shared/image-targets.ts';

const requestSource = await readFile(new URL('../supabase/functions/process-image-upload/request.ts', import.meta.url), 'utf8');

const endpointSource = await readFile(
  new URL('../supabase/functions/process-image-upload/index.ts', import.meta.url),
  'utf8',
);

test('validates multipart input before image transformation', () => {
  assert.match(endpointSource, /parseImageUploadRequest\(formData\)/);
  assert.match(requestSource, /new Set\(\['crop', 'destination', 'file', 'target'\]\)/);
  assert.match(requestSource, /formData\.getAll\(field\)\.length !== 1/);
  assert.doesNotMatch(endpointSource, /formData\.get\(['"](?:bucket|path|path_prefix|output_format|user_id)['"]\)/);
});

test('crop bounds use safe integer source pixels and permit exact edges', () => {
  validateImageCrop({ x: 100, y: 250, width: 900, height: 750 }, 1000, 1000);
  validateImageCrop({ x: 0, y: 0, width: 1000, height: 1000 }, 1000, 1000);
  for (const crop of [
    { x: -1, y: 0, width: 10, height: 10 },
    { x: 0, y: 0, width: 0, height: 10 },
    { x: 0.5, y: 0, width: 10, height: 10 },
    { x: 999, y: 0, width: 2, height: 10 },
    { x: 0, y: 999, width: 10, height: 2 },
    { x: 0, y: 0, width: Infinity, height: 10 },
    { x: NaN, y: 0, width: 10, height: 10 },
    { x: Number.MAX_SAFE_INTEGER, y: 0, width: 10, height: 10 },
  ]) assert.throws(() => validateImageCrop(crop, 1000, 1000), RangeError);
});

test('keeps requested destinations relative to the authenticated user', () => {
  assert.equal(resolveImageDestination('flotillas/2026', 'fallback'), 'flotillas/2026');
  assert.equal(resolveImageDestination(undefined, 'headers'), 'headers');
  assert.throws(() => resolveImageDestination('../outside', ''), /unsafe path segment/);
  assert.throws(() => resolveImageDestination('/outside', ''), /must not start or end with a slash/);
});

test('bundles the pinned ImageMagick runtime asset', async () => {
  const [config, wasm] = await Promise.all([
    readFile(new URL('../supabase/config.toml', import.meta.url), 'utf8'),
    stat(new URL('../supabase/functions/process-image-upload/magick.wasm', import.meta.url)),
  ]);

  assert.match(config, /static_files = \["\.\/functions\/process-image-upload\/magick\.wasm"\]/);
  assert.ok(wasm.size > 1_000_000);
});

test('keeps image destinations and transforms in code-owned targets', () => {
  assert.ok(Object.hasOwn(imageUploadTargets, 'profile_avatar'));
  assert.ok(Object.hasOwn(imageUploadTargets, 'profile_header'));
  assert.equal(imageUploadTargets.profile_avatar.bucket, 'user-avatars');
  assert.equal(imageUploadTargets.profile_avatar.pathPrefix, '');
  assert.equal(imageUploadTargets.profile_avatar.outputFormat, 'jpeg');
  assert.equal(imageUploadTargets.profile_header.pathPrefix, 'headers');
});

test('supports an internally configured PNG target', () => {
  const targets = defineImageUploadTargets({
    lossless_preview: {
      bucket: 'project-images',
      filenamePrefix: 'preview',
      fit: 'inside',
      maxWidth: 1024,
      outputFormat: 'png',
      pathPrefix: 'previews',
      pngCompressionPercent: 80,
      visibility: 'private',
    },
  });

  assert.equal(targets.lossless_preview.outputFormat, 'png');
  assert.equal(targets.lossless_preview.pngCompressionPercent, 80);
});

test('rejects unsafe destination paths and invalid transform values', () => {
  assert.throws(
    () =>
      defineImageUploadTargets({
        unsafe: {
          bucket: 'user-avatars',
          filenamePrefix: 'avatar',
          fit: 'inside',
          outputFormat: 'jpeg',
          pathPrefix: '../outside',
          qualityPercent: 80,
          visibility: 'private',
        },
      }),
    /unsafe path segment/,
  );

  assert.throws(
    () =>
      defineImageUploadTargets({
        invalid_quality: {
          bucket: 'user-avatars',
          filenamePrefix: 'avatar',
          fit: 'inside',
          outputFormat: 'jpeg',
          pathPrefix: '',
          qualityPercent: 101,
          visibility: 'private',
        },
      }),
    /qualityPercent/,
  );
});

test('Bruno documents optional source cropping and the unchanged upload boundary', async () => {
  const request = await readFile(new URL('../docs/bruno/supacharger-rpc/edge-functions/process_image_upload.bru', import.meta.url), 'utf8');
  assert.match(request, /\/functions\/v1\/process-image-upload/);
  assert.match(request, /Authorization: Bearer \{\{SUPABASE_ACCESS_TOKEN\}\}/);
  assert.match(request, /file: @file\(\{\{IMAGE_FILE_PATH\}\}\)/);
  const crop = request.match(/~crop: (\{[^\n]+\})/);
  assert.ok(crop, 'keep the crop example optional by default');
  validateImageCrop(JSON.parse(crop[1]), 1000, 1000);
  assert.match(request, /EXIF orientation/);
  assert.match(request, /400:/);
  assert.match(request, /422:/);
  assert.doesNotMatch(request, /(?:Accept|Content)-Profile:/);
});
