import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { defineImageUploadTargets } from '../supabase/functions/_shared/image-target-contract.ts';
import { imageUploadTargets } from '../supabase/functions/_shared/image-targets.ts';

const endpointSource = await readFile(
  new URL('../supabase/functions/process-image-upload/index.ts', import.meta.url),
  'utf8',
);

test('accepts only one file and one code-owned target from the caller', () => {
  assert.match(endpointSource, /new Set\(\['file', 'target'\]\)/);
  assert.match(endpointSource, /formData\.getAll\('file'\)\.length !== 1/);
  assert.match(endpointSource, /formData\.getAll\('target'\)\.length !== 1/);
  assert.doesNotMatch(endpointSource, /formData\.get\(['"](?:bucket|path|path_prefix|output_format)['"]\)/);
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
