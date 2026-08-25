import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('project auth controls outrank shared primitives and match input dimensions', async () => {
  const [globals, authStyles] = await Promise.all([
    read('src/supacharger/styles/globals.css'),
    read('src/styles/supacharger-auth.css'),
  ]);

  assert.ok(
    globals.indexOf("@import '../../styles/supacharger-auth.css';") <
      globals.indexOf("@import '../../styles/supacharger-account.css';"),
  );
  assert.match(authStyles, /\.sc-auth-page \.sc-control-button\.sc-auth-surface-button/);
  assert.match(authStyles, /\.sc-auth-page \.sc-control-button\.sc-auth-primary-button/);
  assert.match(authStyles, /min-height:\s*3\.5rem/);
  assert.match(authStyles, /padding:\s*0\.75rem 1\.25rem/);
  assert.doesNotMatch(
    await read('src/styles/supacharger-account.css'),
    /^\.sc-control-(?:button|input|textarea|label)\b/m,
  );
});

test('account password fields remain one per row at every viewport width', async () => {
  const accountStyles = await read('src/styles/supacharger-account.css');

  assert.match(accountStyles, /\.sc-account-password-grid\s*\{[^}]*grid-template-columns:\s*minmax\(0,\s*1fr\)/);
  assert.doesNotMatch(accountStyles, /\.sc-account-password-grid\s*\{\s*grid-template-columns:\s*repeat\(2/);
});

test('password checklist floats below its input without changing form layout', async () => {
  const authStyles = await read('src/styles/supacharger-auth.css');
  const tooltip = authStyles.match(/\.sc-auth-password-tooltip\s*\{([^}]*)\}/)?.[1] ?? '';

  assert.match(tooltip, /position:\s*absolute/);
  assert.match(tooltip, /top:\s*calc\(100%\s*\+\s*0\.5rem\)/);
  assert.match(tooltip, /left:\s*0/);
  assert.match(tooltip, /margin-top:\s*0/);
});
