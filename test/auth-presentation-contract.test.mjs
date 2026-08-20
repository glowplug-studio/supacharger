import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('auth journey retains the promoted SnapScreen presentation', async () => {
  const [entry, form, styles] = await Promise.all([
    read('src/supacharger/components/forms/auth-entry.tsx'),
    read('src/supacharger/components/forms/login-user-form.tsx'),
    read('src/supacharger/styles/supacharger.css'),
  ]);

  assert.match(entry, /Typewriter/);
  assert.match(entry, /space-y-10 px-2 pt-8/);
  assert.match(form, /AnimateHeight/);
  assert.match(form, /sc-auth-surface-button/);
  assert.match(form, /sc-auth-primary-button/);
  assert.match(form, /OTPField/);
  assert.match(form, /ResendVerificationEmail/);
  assert.match(styles, /\.sc-auth-input/);
  assert.match(styles, /\.sc-auth-otp input/);
});

test('password reset uses the same auth presentation without replacing its logic', async () => {
  const [page, form] = await Promise.all([
    read('src/app/(supacharger)/(unauthenticated)/account/reset-password/new/page.tsx'),
    read('src/supacharger/components/forms/reset-password-request-link-form.tsx'),
  ]);

  assert.match(page, /exchangeCodeForSession/);
  assert.match(page, /sc-auth-input/);
  assert.match(form, /request-password-reset/);
  assert.match(form, /sc-auth-primary-button/);
});
