import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { access, readdir, readFile } from 'node:fs/promises';
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

async function findAppPages(directory, segments = []) {
  const pages = [];

  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const entryUrl = new URL(entry.name, directory);
    if (entry.isDirectory()) {
      pages.push(...(await findAppPages(new URL(`${entry.name}/`, directory), [...segments, entry.name])));
    } else if (/^page\.[cm]?[jt]sx?$/.test(entry.name)) {
      const route = `/${segments.filter((segment) => !/^\(.*\)$/.test(segment)).join('/')}`;
      pages.push({ file: fileURLToPath(entryUrl), route });
    }
  }

  return pages;
}

test('does not define parallel pages for the same public route', async () => {
  const pages = await findAppPages(new URL('../src/app/', import.meta.url));
  const filesByRoute = Map.groupBy(pages, (page) => page.route);
  const duplicates = [...filesByRoute]
    .filter(([, matches]) => matches.length > 1)
    .map(([route, matches]) => ({ route, files: matches.map((match) => match.file) }));

  assert.deepEqual(duplicates, []);
});

test('root tool configuration uses explicit module formats', () => {
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

  const postcss = spawnSync(process.execPath, ['--eval', 'import("./postcss.config.mjs")'], {
    cwd: projectRoot,
    encoding: 'utf8',
  });
  assert.equal(postcss.status, 0, postcss.stderr);
});

test('preserves Tailwind defaults and supplies every shared semantic style token', async () => {
  const [tailwindConfig, projectStyles, authStyles] = await Promise.all([
    readFile(new URL('../tailwind.config.ts', import.meta.url), 'utf8'),
    readFile(new URL('../src/styles/project.css', import.meta.url), 'utf8'),
    readFile(new URL('../src/styles/supacharger-auth.css', import.meta.url), 'utf8'),
  ]);

  assert.doesNotMatch(tailwindConfig, /\b(?:borderRadius|container|fontFamily)\s*:/);
  assert.doesNotMatch(projectStyles, /--radius\s*:/);
  assert.match(authStyles, /@apply\s+[^;]*\brounded-(?:lg|2xl|full)\b[^;]*;/);
  assert.doesNotMatch(authStyles, /border-radius\s*:/);

  const semanticTokens = [
    'background',
    'foreground',
    'muted',
    'muted-foreground',
    'popover',
    'popover-foreground',
    'border',
    'input',
    'card',
    'card-foreground',
    'primary',
    'primary-foreground',
    'secondary',
    'secondary-foreground',
    'accent',
    'accent-foreground',
    'destructive',
    'destructive-foreground',
    'ring',
    'sidebar-background',
    'sidebar-foreground',
    'sidebar-primary',
    'sidebar-primary-foreground',
    'sidebar-accent',
    'sidebar-accent-foreground',
    'sidebar-border',
    'sidebar-ring',
  ];

  for (const token of semanticTokens) {
    assert.match(projectStyles, new RegExp(`--${token}\\s*:`), `missing --${token}`);
  }
});

test('Next uses Cache Components and accepts the documented loopback hostname', async () => {
  const javascriptConfig = new URL('../next.config.js', import.meta.url);
  const typescriptConfig = new URL('../next.config.ts', import.meta.url);
  const configUrl = await access(javascriptConfig).then(
    () => javascriptConfig,
    () => typescriptConfig,
  );
  const result = spawnSync(
    process.execPath,
    [
      '--experimental-strip-types',
      '--input-type=module',
      '--eval',
      `const {default: config} = await import(${JSON.stringify(configUrl.href)});` +
        `if (!config.allowedDevOrigins?.includes('127.0.0.1')) throw new Error('missing loopback origin');` +
        `if (config.cacheComponents !== true) throw new Error('Cache Components must be enabled');`,
    ],
    { cwd: projectRoot, encoding: 'utf8' },
  );

  assert.equal(result.status, 0, result.stderr);
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
  assert.ok(manifest.managedPaths.includes('src/lib/supabase/client.ts'));
  assert.ok(manifest.managedPaths.includes('src/lib/supabase/server.ts'));
  assert.ok(manifest.managedPaths.includes('postcss.config.mjs'));
  assert.ok(manifest.mergeManagedPaths.includes('package.json'));
  assert.ok(manifest.mergeManagedPaths.includes('supabase/config.toml'));
  assert.ok(manifest.mergeManagedPaths.includes('tailwind.config.ts'));
  assert.deepEqual(manifest.forwardOnlyMigrationPaths, ['supabase/migrations']);
  assert.ok(!manifest.managedPaths.includes('package.json'));
  assert.ok(!manifest.managedPaths.includes('supabase/config.toml'));
  assert.ok(!manifest.managedPaths.includes('supabase/migrations'));
  assert.ok(!manifest.managedPaths.includes('tailwind.config.ts'));
  assert.ok(manifest.developerOwnedPaths.includes('test/project-billing-schema-contract.test.mjs'));
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
    assert.match(root, /\bviewBox="[^"]+"/);
    assert.doesNotMatch(root, /\b(?:width|height)=/);
  }

  assert.match(wrapper, /fill\s*=\s*'currentColor'/);
  assert.match(wrapper, /<Loader[\s\S]*?fill=\{fill\}/);
  assert.ok(manifest.developerOwnedPaths.includes('src/assets/svgr/ui/inline-loader.svg'));
  assert.ok(manifest.developerOwnedPaths.includes('src/assets/svgr/ui/inline-loader-dark.svg'));
  assert.ok(!manifest.managedPaths.includes('src/assets'));
});

test('offers the protected theme choices in the canonical three-position order', async () => {
  const toggle = await readFile(
    new URL('../src/supacharger/components/buttons/mode-toggle-button.tsx', import.meta.url),
    'utf8',
  );
  const choices = ["value: 'system'", "value: 'light'", "value: 'dark'"];
  const positions = choices.map((choice) => toggle.indexOf(choice));

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
  assert.match(
    toggle,
    /appearance === 'marketing' &&[\s\S]*?'[^']*inline-flex items-center justify-center whitespace-nowrap[^']*'/,
  );
  assert.match(toggle, /\[&_svg\]:size-4/);
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
