import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('image loader stays responsive and developer-owned', async () => {
  const source = await readFile(new URL('../src/assets/svgr/ui/image-loader.svg', import.meta.url), 'utf8');
  const root = source.match(/<svg\b([^>]*)>/)?.[1] ?? '';
  assert.match(root, /\bviewBox="0 0 100 100"/);
  assert.doesNotMatch(root, /\b(?:width|height)=/);
  assert.match(root, /fill="currentColor"/);
  const manifest = JSON.parse(await readFile(new URL('../.supacharger/managed-files.json', import.meta.url), 'utf8'));
  assert.ok(manifest.developerOwnedPaths.includes('src/assets/svgr/ui/image-loader.svg'));
  assert.ok(!manifest.managedPaths.includes('src/assets/svgr/ui/image-loader.svg'));
});
