import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('managed account routes receive the Korunet authenticated header and footer once', async () => {
  const [chrome, projectAccountLayout] = await Promise.all([
    read('src/supacharger.adapters/account/chrome.tsx'),
    read('src/app/(project)/(authenticated)/account/layout.tsx'),
  ]);

  assert.match(chrome, /AuthenticatedAppShell/);
  assert.match(chrome, /<AuthenticatedAppShell>\{children\}<\/AuthenticatedAppShell>/);
  assert.doesNotMatch(projectAccountLayout, /AccountChrome/);
});
