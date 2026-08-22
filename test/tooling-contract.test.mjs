import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readdir, readFile } from 'node:fs/promises';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const projectRoot = fileURLToPath(new URL('../', import.meta.url));

async function findLegacyCnImports(directory) {
  const matches = [];

  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const entryUrl = new URL(entry.name, directory);

    if (entry.isDirectory()) {
      matches.push(...(await findLegacyCnImports(new URL(`${entry.name}/`, directory))));
    } else if (/\.[cm]?[jt]sx?$/.test(entry.name)) {
      const source = await readFile(entryUrl, 'utf8');
      if (/import\s*\{[^}]*\bcn\b[^}]*\}\s*from\s*['"]@\/lib\/utils['"]/s.test(source)) {
        matches.push(fileURLToPath(entryUrl));
      }
    }
  }

  return matches;
}

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

test('uses the canonical class-name utility module', async () => {
  const components = JSON.parse(await readFile(new URL('../components.json', import.meta.url), 'utf8'));
  const utility = await readFile(new URL('../src/utils/cn.ts', import.meta.url), 'utf8');
  const legacyImports = await findLegacyCnImports(new URL('../src/', import.meta.url));

  assert.equal(components.aliases.utils, '@/utils/cn');
  assert.match(utility, /export function cn/);
  assert.deepEqual(legacyImports, []);
});

test('keeps the root layout editable and the root document implementation managed', async () => {
  const manifest = JSON.parse(await readFile(new URL('../.supacharger/managed-files.json', import.meta.url), 'utf8'));
  const rootDocument = await readFile(new URL('../src/supacharger/root-document.tsx', import.meta.url), 'utf8');

  assert.ok(manifest.developerOwnedPaths.includes('src/app/layout.tsx'));
  assert.ok(manifest.managedPaths.includes('src/supacharger'));
  assert.match(rootDocument, /createSupachargerMetadata/);
  assert.match(rootDocument, /createSupachargerPageMetadata/);
  assert.match(rootDocument, /@next\/third-parties\/google/);
  assert.doesNotMatch(rootDocument, /G-[A-Z0-9]{6,}/);
});

test('keeps inline loader variants responsive and colour configurable', async () => {
  const [defaultLoader, darkLoader, wrapper, manifestSource] = await Promise.all([
    readFile(new URL('../src/assets/svgr/ui/inline-loader.svg', import.meta.url), 'utf8'),
    readFile(new URL('../src/assets/svgr/ui/inline-loader-dark.svg', import.meta.url), 'utf8'),
    readFile(new URL('../src/components/ui/loading-spinner.tsx', import.meta.url), 'utf8'),
    readFile(new URL('../.supacharger/managed-files.json', import.meta.url), 'utf8'),
  ]);
  const manifest = JSON.parse(manifestSource);

  for (const source of [defaultLoader, darkLoader]) {
    const root = source.match(/<svg\b([^>]*)>/)?.[1] ?? '';
    const artwork = source.replace(/^[\s\S]*?<svg\b[^>]*>/, '');

    assert.match(root, /\bviewBox="0 0 100 100"/);
    assert.doesNotMatch(root, /\b(?:width|height)=/);
    assert.doesNotMatch(artwork, /\b(?:fill|stroke)=/);
  }

  assert.match(defaultLoader, /<svg[\s\S]*?\bfill="#ffffff"/);
  assert.match(darkLoader, /<svg[\s\S]*?\bfill="#000000"/);
  assert.match(wrapper, /fill\s*=\s*'currentColor'/);
  assert.match(wrapper, /<Loader[\s\S]*?fill=\{fill\}/);
  assert.ok(manifest.developerOwnedPaths.includes('src/assets/svgr/ui/inline-loader.svg'));
  assert.ok(manifest.developerOwnedPaths.includes('src/assets/svgr/ui/inline-loader-dark.svg'));
  assert.ok(!manifest.managedPaths.includes('src/assets'));
});

test('offers the footer theme choices in the canonical three-position order', async () => {
  const [toggle, footer, layout, englishMessages] = await Promise.all([
    readFile(new URL('../src/supacharger/components/buttons/mode-toggle-button.tsx', import.meta.url), 'utf8'),
    readFile(new URL('../src/components/sc_demo/sc_footer.tsx', import.meta.url), 'utf8'),
    readFile(new URL('../src/app/layout.tsx', import.meta.url), 'utf8'),
    readFile(new URL('../messages/en.json', import.meta.url), 'utf8'),
  ]);
  const choices = ["value: 'system'", "value: 'light'", "value: 'dark'"];
  const positions = choices.map((choice) => toggle.indexOf(choice));
  const messages = JSON.parse(englishMessages);

  assert.ok(positions.every((position) => position >= 0));
  assert.deepEqual(
    positions,
    [...positions].sort((left, right) => left - right),
  );
  assert.match(toggle, /<ToggleGroup/);
  assert.match(toggle, /MonitorCog/);
  assert.match(toggle, /Sun/);
  assert.match(toggle, /Moon/);
  assert.match(toggle, /useSyncExternalStore/);
  assert.match(
    toggle,
    /const mounted = useSyncExternalStore\(subscribeToHydration, getClientSnapshot, getServerSnapshot\)/,
  );
  assert.match(toggle, /mounted\s*\?\s*\(themeChoices\.find/);
  assert.match(footer, /<LocaleSwitcher appearance='marketing'\s*\/>[\s\S]*?<ModeToggle appearance='marketing'\s*\/>/);
  assert.match(layout, /<ThemeProvider[^>]*enableSystem/);
  assert.match(layout, /<body[\s\S]*?<SupachargerAnalytics config=\{SC_CONFIG\} \/>[\s\S]*?<\/body>/);
  assert.deepEqual(messages.ThemeChangerMenu, {
    title: 'Theme',
    light: 'Light',
    dark: 'Dark',
    system: 'System',
  });
});

test('smooths global fragment navigation while respecting reduced-motion preferences', async () => {
  const [styles, navigation, layout] = await Promise.all([
    readFile(new URL('../src/supacharger/styles/supacharger.css', import.meta.url), 'utf8'),
    readFile(new URL('../src/supacharger/components/layout/smooth-anchor-navigation.tsx', import.meta.url), 'utf8'),
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
