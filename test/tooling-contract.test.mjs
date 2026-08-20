import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const projectRoot = fileURLToPath(new URL('../', import.meta.url));

test('Tailwind configuration loads without Node reparsing the package as ESM', () => {
  const result = spawnSync(
    process.execPath,
    ['--experimental-strip-types', '--eval', 'import("./tailwind.config.ts")'],
    {
      cwd: projectRoot,
      encoding: 'utf8',
    },
  );

  assert.equal(result.status, 0, result.stderr);
  assert.doesNotMatch(result.stderr, /MODULE_TYPELESS_PACKAGE_JSON/);
});

test('keeps the root layout editable and the root document implementation managed', async () => {
  const manifest = JSON.parse(
    await readFile(new URL('../.supacharger/managed-files.json', import.meta.url), 'utf8'),
  );
  const rootDocument = await readFile(
    new URL('../src/supacharger/root-document.tsx', import.meta.url),
    'utf8',
  );

  assert.ok(manifest.developerOwnedPaths.includes('src/app/layout.tsx'));
  assert.ok(manifest.managedPaths.includes('src/supacharger'));
  assert.match(rootDocument, /createSupachargerMetadata/);
  assert.match(rootDocument, /createSupachargerPageMetadata/);
  assert.match(rootDocument, /@next\/third-parties\/google/);
  assert.doesNotMatch(rootDocument, /G-[A-Z0-9]{6,}/);
});

test('smooths global fragment navigation while respecting reduced-motion preferences', async () => {
  const [styles, navigation, layout] = await Promise.all([
    readFile(new URL('../src/supacharger/styles/supacharger.css', import.meta.url), 'utf8'),
    readFile(
      new URL('../src/supacharger/components/layout/smooth-anchor-navigation.tsx', import.meta.url),
      'utf8',
    ),
    readFile(new URL('../src/app/layout.tsx', import.meta.url), 'utf8'),
  ]);

  assert.match(styles, /html\s*\{[\s\S]*?scroll-behavior:\s*smooth/);
  assert.match(styles, /@media\s*\(prefers-reduced-motion:\s*reduce\)/);
  assert.match(styles, /scroll-behavior:\s*auto/);
  assert.match(navigation, /document\.addEventListener\('click',[\s\S]*?capture:\s*true/);
  assert.match(navigation, /scrollIntoView\(\{ behavior/);
  assert.match(navigation, /prefers-reduced-motion:\s*reduce/);
  assert.match(navigation, /event\.preventDefault\(\)/);
  assert.match(layout, /<SmoothAnchorNavigation\s*\/>/);
});
