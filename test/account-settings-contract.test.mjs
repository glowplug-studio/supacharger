import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

function literalClassTokens(source) {
  return [...source.matchAll(/className=['"]([^'"]+)['"]/g)].flatMap((match) => match[1].split(/\s+/));
}

test('managed account presentation uses only semantic developer CSS hooks', async () => {
  const sources = await Promise.all([
    read('src/app/(supacharger)/(verified)/account/mfa/page.tsx'),
    read('src/supacharger/account/preferences/preference-form.tsx'),
    read('src/supacharger/account/security/mfa-challenge-form.tsx'),
    read('src/supacharger/account/security/security-forms.tsx'),
    read('src/supacharger/account/security/security-page.tsx'),
    read('src/supacharger/account/security/totp-panel.tsx'),
    read('src/supacharger/account/settings/account-details-form.tsx'),
    read('src/supacharger/account/settings/account-media-field.tsx'),
    read('src/supacharger/account/settings/account-settings-shell.tsx'),
  ]);
  const tokens = sources.flatMap(literalClassTokens);
  assert.ok(tokens.length > 0);
  assert.deepEqual(
    tokens.filter((token) => !token.startsWith('sc-')),
    [],
  );

  const styles = await read('src/styles/supacharger-account.css');
  assert.match(styles, /\.sc-account-shell/);
  assert.match(styles, /\.sc-account-mfa-page/);
  assert.match(styles, /\.sc-account-mfa-enrollment/);
  assert.doesNotMatch(styles, /@layer/);
});

test('managed account routes use the canonical shell and server details boundary', async () => {
  const [page, layout, route, schema, manifestSource] = await Promise.all([
    read('src/app/(supacharger)/(authenticated)/account/page.tsx'),
    read('src/app/(supacharger)/(authenticated)/account/layout.tsx'),
    read('src/app/(supacharger)/api/account/details/route.ts'),
    read('src/supacharger/account/settings/account-details-schema.ts'),
    read('.supacharger/managed-files.json'),
  ]);
  const manifest = JSON.parse(manifestSource);

  assert.match(page, /AccountDetailsPage/);
  assert.match(layout, /AccountSettingsShell/);
  assert.match(route, /request\.json\(\)/);
  assert.match(route, /safeParse\(body\)/);
  assert.match(route, /auth\.getUser\(\)/);
  assert.match(route, /update_account_profile_by_current_user/);
  assert.match(route, /update_account_language_by_current_user/);
  assert.match(schema, /z\s*\.object/);
  assert.ok(manifest.managedPaths.includes('src/app/(supacharger)'));
  assert.ok(manifest.managedPaths.includes('src/supacharger'));
});

test('profile extensions are developer-owned, typed, and server-validated', async () => {
  const [route, fields, extension, manifestSource] = await Promise.all([
    read('src/app/(supacharger)/api/account/details/route.ts'),
    read('src/supacharger.adapters/account/profile-fields.tsx'),
    read('src/supacharger.adapters/account/profile-extension.ts'),
    read('.supacharger/managed-files.json'),
  ]);
  const manifest = JSON.parse(manifestSource);

  assert.match(route, /accountProfileExtensionSchema\.safeParse/);
  assert.match(route, /updateAccountProfileExtension/);
  assert.match(fields, /AccountProfileFields/);
  assert.match(extension, /z\.object\(\{\}\)\.strict\(\)/);
  assert.ok(manifest.developerOwnedPaths.includes('src/supacharger.adapters'));
});

test('profile media commits the path before deleting the prior object and refreshes menus', async () => {
  const media = await read('src/supacharger/account/settings/account-media-field.tsx');
  const mutationPosition = media.indexOf('await mutation');
  const oldDeletePosition = media.indexOf('if (path && path !== nextPath)');

  assert.ok(mutationPosition >= 0);
  assert.ok(oldDeletePosition > mutationPosition);
  assert.match(media, /process-image-upload/);
  assert.match(media, /publishAccountSummaryChanged\(\)/);
  assert.match(media, /router\.refresh\(\)/);
  assert.match(media, /showActionToast\('success'/);
  assert.match(media, /showActionToast\('error'/);
});

test('managed account mutations retain inline feedback and emit action toasts', async () => {
  const sources = await Promise.all([
    read('src/supacharger/account/preferences/preference-form.tsx'),
    read('src/supacharger/account/settings/account-details-form.tsx'),
    read('src/supacharger/account/settings/account-media-field.tsx'),
  ]);
  for (const source of sources) {
    assert.match(source, /role=.*(?:alert|status)|role='(?:alert|status)'/);
    assert.match(source, /showActionToast/);
  }
});

test('approved account settings configuration and complete English copy are present', async () => {
  const [contract, config, englishSource] = await Promise.all([
    read('src/supacharger/supacharger-config-contract.ts'),
    read('src/supacharger.config.ts'),
    read('messages/en.json'),
  ]);
  const english = JSON.parse(englishSource);

  assert.match(contract, /ACCOUNT_SETTINGS/);
  assert.match(contract, /AVATAR: 'disabled' \| 'optional'/);
  assert.match(contract, /HEADER_IMAGE: 'disabled' \| 'optional'/);
  assert.match(contract, /ACCOUNT_SUBJECTS/);
  assert.match(config, /CANCEL_ACCOUNT:\s*['"]disabled['"]/);
  assert.equal(typeof english.AccountSettings.title, 'string');
  assert.ok(english.AccountSettings.title.trim());
  assert.ok(english.AccountSettings.details.saved.trim());
  assert.ok(english.AccountSettings.validation.summaryLoad.trim());
});
