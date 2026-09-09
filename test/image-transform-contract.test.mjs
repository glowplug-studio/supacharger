import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import test from 'node:test';

import {
  defineImageUploadTargets,
  resolveImageDestination,
} from '../supabase/functions/_shared/image-target-contract.ts';
import { imageUploadTargets } from '../supabase/functions/_shared/image-targets.ts';

const endpointSource = await readFile(
  new URL('../supabase/functions/process-image-upload/index.ts', import.meta.url),
  'utf8',
);

test('accepts one file, one code-owned target, and an optional safe destination', () => {
  assert.match(endpointSource, /new Set\(\['destination', 'file', 'target'\]\)/);
  assert.match(endpointSource, /formData\.getAll\('file'\)\.length !== 1/);
  assert.match(endpointSource, /formData\.getAll\('target'\)\.length !== 1/);
  assert.doesNotMatch(endpointSource, /formData\.get\(['"](?:bucket|path|path_prefix|output_format|user_id)['"]\)/);
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
