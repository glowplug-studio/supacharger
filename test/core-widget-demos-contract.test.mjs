import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('project-owned widget demos expose reusable file and crop controls publicly', async () => {
  const [demo, fileUpload, imageUpload, imageLoader, config, manifestSource] = await Promise.all([
    read('src/components/sc_demo/sc_core-widget-demos.tsx'),
    read('src/components/sc_widgets/file-upload/file-upload-widget.tsx'),
    read('src/components/sc_widgets/image-upload/image-upload-widget.tsx'),
    read('src/components/sc_widgets/media/image-with-loader.tsx'),
    read('src/supacharger.config.ts'),
    read('.supacharger/managed-files.json'),
  ]);
  const manifest = JSON.parse(manifestSource);

  assert.match(demo, /<FileUploadWidget/);
  assert.match(demo, /variant='banner'/);
  assert.match(demo, /variant='avatar'/);
  assert.match(fileUpload, /multiple/);
  assert.doesNotMatch(fileUpload, /Untitled|DocumentFileIcon|file-icons/);
  assert.match(imageUpload, /BannerCropPreview/);
  assert.match(imageUpload, /ImageRepositionDialog/);
  assert.match(imageLoader, /await image\.decode\(\)/);
  assert.match(imageLoader, /transition-opacity/);
  assert.match(config, /'\/features\/:path\*'/);
  assert.ok(manifest.developerOwnedPaths.includes('src/components/sc_widgets'));
});

test('image compression and destinations stay in project-owned policy', async () => {
  const [targets, widgetPolicy, upload] = await Promise.all([
    read('supabase/functions/_shared/image-targets.ts'),
    read('src/components/sc_widgets/image-upload/project-image-policy.ts'),
    read('src/components/sc_widgets/media/project-image-upload.ts'),
  ]);

  for (const setting of ['maxWidth', 'maxHeight', 'outputFormat', 'qualityPercent', 'bucket', 'pathPrefix']) {
    assert.match(targets, new RegExp(setting));
  }
  assert.match(widgetPolicy, /destination:\s*'headers'/);
  assert.match(upload, /formData\.set\('destination'/);
  assert.match(upload, /formData\.set\('crop'/);
});
