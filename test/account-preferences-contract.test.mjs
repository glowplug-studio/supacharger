import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('managed privacy and notification routes use the descriptor renderer', async () => {
  const [privacy, notifications, page, form] = await Promise.all([
    read('src/app/(supacharger)/(authenticated)/account/privacy/page.tsx'),
    read('src/app/(supacharger)/(authenticated)/account/notifications/page.tsx'),
    read('src/supacharger/account/preferences/preference-page.tsx'),
    read('src/supacharger/account/preferences/preference-form.tsx'),
  ]);
  assert.match(privacy, /PreferencePage kind='privacy'/);
  assert.match(notifications, /PreferencePage kind='notifications'/);
  assert.match(page, /preferenceSurfaceSchema\.safeParse/);
  assert.match(form, /\/api\/account\/preferences\/\$\{kind\}/);
  assert.doesNotMatch(form, /setTimeout|mockData|Simulate API/);
});

test('preference mutation validates auth, descriptors, and submitted option identity', async () => {
  const [contract, route] = await Promise.all([
    read('src/supacharger/account/preferences/preference-contract.ts'),
    read('src/app/(supacharger)/api/account/preferences/[kind]/route.ts'),
  ]);
  assert.match(contract, /preferenceOptionSchema/);
  assert.match(contract, /z\.record/);
  assert.match(route, /auth\.getUser\(\)/);
  assert.match(route, /preferenceMutationSchema\.safeParse/);
  assert.match(route, /allowedOptions/);
  assert.match(route, /changesDisabledOption/);
  assert.match(route, /adapter\.update/);
});

test('adapters declare honest availability and never fake persistence', async () => {
  for (const adapter of ['privacy', 'notifications']) {
    const source = await read(`src/supacharger.adapters/account/${adapter}.ts`);
    assert.match(source, /availability: '(?:disabled|enabled)'/);
    if (source.includes("availability: 'disabled'")) assert.match(source, /throw new Error/);
    assert.doesNotMatch(source, /setTimeout|mockData|success: true/);
  }
});

test('English preference copy and navigation labels are complete', async () => {
  const messages = JSON.parse(await read('messages/en.json'));
  for (const key of ['privacy', 'notifications']) assert.ok(messages.AccountSettings.navigation[key].trim());
  for (const key of ['save', 'saving', 'saved', 'unavailable', 'empty']) assert.ok(messages.AccountPreferences[key].trim());
  for (const key of ['privacy', 'notifications']) {
    for (const value of Object.values(messages.AccountPreferences[key])) assert.ok(value.trim());
  }
});
