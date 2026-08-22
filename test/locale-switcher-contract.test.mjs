import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('the locale menu does not lock the page or mobile navigation', async () => {
  const switcher = await read('src/components/sc_demo/sc_locale-switcher.tsx');

  assert.match(switcher, /<DropdownMenu modal=\{false\}>/);
  assert.match(switcher, /resolveLocale\(useLocale\(\)\)/);
  assert.doesNotMatch(switcher, /useEffect|fetch\('\/api\/intl'\)[\s\S]*?method:\s*'GET'/);
});

test('locale menu options show native language names', async () => {
  const switcher = await read('src/components/sc_demo/sc_locale-switcher.tsx');

  assert.match(switcher, /label: 'English'/);
  assert.match(switcher, /label: 'Español'/);
  assert.match(switcher, /label: '中文'/);
  assert.doesNotMatch(switcher, /label: t\('english'\)|label: t\('spanish'\)|label: t\('chinese'\)/);
});

test('shared menu controls stay interactive inside composed surfaces', async () => {
  const [button, dropdownMenu] = await Promise.all([
    read('src/components/ui/button.tsx'),
    read('src/components/ui/dropdown-menu.tsx'),
  ]);

  assert.match(button, /type = "button"/);
  assert.match(button, /type=\{asChild \? undefined : type\}/);
  assert.match(dropdownMenu, /DropdownMenuSubContent[\s\S]*?<DropdownMenuPrimitive\.Portal>/);
});

test('locale changes survive profile sync failures and retry later', async () => {
  const route = await read('src/app/(supacharger)/api/(supacharger)/intl/route.ts');

  assert.match(route, /localeRequestSchema\.safeParse\(body\)/);
  assert.match(route, /response\.cookies\.set\(LOCALE_COOKIE_NAME, locale, localeCookieOptions\)/);
  assert.match(route, /languageSyncSucceeded = !error/);
  assert.match(route, /response\.cookies\.set\(LOCALE_PROFILE_SYNC_COOKIE_NAME, '1', localeCookieOptions\)/);
  assert.doesNotMatch(route, /Unable to save locale preference|status:\s*500/);
});

test('all locale catalogues are explicit dependencies of the request configuration', async () => {
  const requestConfig = await read('src/i18n/request.ts');

  assert.match(requestConfig, /import englishMessages from '\.\.\/\.\.\/messages\/en\.json'/);
  assert.match(requestConfig, /import spanishMessages from '\.\.\/\.\.\/messages\/es\.json'/);
  assert.match(requestConfig, /import chineseMessages from '\.\.\/\.\.\/messages\/zh\.json'/);
  assert.match(requestConfig, /messages: messageCatalogues\[locale\]/);
  assert.doesNotMatch(requestConfig, /import\(`\.\.\/\.\.\/messages\/\$\{locale\}\.json`\)/);
});
