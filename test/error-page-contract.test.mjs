import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('application-owned error routes use the auth-aware branded presentation', async () => {
  const [component, errorPage, notFoundPage, config, proxy] = await Promise.all([
    read('src/components/sc_widgets/error-page/application-error-page.tsx'),
    read('src/app/error/page.tsx'),
    read('src/app/not-found.tsx'),
    read('src/supacharger.config.ts'),
    read('src/proxy.ts'),
  ]);

  assert.match(component, /isLoggedIn\(\)/);
  assert.match(component, /getMessages\(\)/);
  assert.match(component, /resolveApplicationErrorCopy\(messages, kind\)/);
  assert.doesNotMatch(component, /getTranslations\(['"]ErrorPage['"]\)/);
  assert.match(component, /<SCHeaderSession\s*\/>/);
  assert.match(component, /<SCFooterSession\s*\/>/);
  assert.match(component, /min-h-\[100dvh\]/);
  assert.match(component, /bg-primary/);
  assert.match(component, /text-primary-foreground/);
  assert.match(component, /rounded-none/);
  assert.match(component, /ArrowRight/);
  assert.match(errorPage, /kind='unexpected'/);
  assert.match(notFoundPage, /kind='notFound'/);
  assert.match(config, /["']\/error["']/);
  assert.match(proxy, /pathname !== ['"]\/error['"]/);
});
