import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('auth journey retains the promoted SnapScreen presentation', async () => {
  const [entry, form, styles, leftPanel] = await Promise.all([
    read('src/supacharger/components/forms/auth-entry.tsx'),
    read('src/supacharger/components/forms/login-user-form.tsx'),
    read('src/supacharger/styles/supacharger.css'),
    read('src/components/sc_demo/sc_account-login-left.tsx'),
  ]);

  assert.match(entry, /Typewriter/);
  assert.match(entry, /space-y-10 px-2 pt-8/);
  assert.match(entry, /SCSiteLogo/);
  assert.match(entry, /justify-center px-2 lg:hidden/);
  assert.match(entry, /showSiteTitle=\{true\} darkMode=\{true\}/);
  assert.match(leftPanel, /hidden[\s\S]*?lg:flex/);
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

test('revealing a signup password clears and collapses password confirmation', async () => {
  const [journey, embeddedSignup] = await Promise.all([
    read('src/supacharger/components/forms/login-user-form.tsx'),
    read('src/supacharger/components/forms/create-account-form.tsx'),
  ]);

  for (const form of [journey, embeddedSignup]) {
    assert.match(form, /height=\{showPassword \? 0 : 'auto'\}/);
    assert.match(form, /animateOpacity/);
    assert.match(form, /disabled=\{showPassword\}/);
  }

  assert.match(journey, /setPasswordAgain\(''\)/);
  assert.match(journey, /passwordConfirmationRequired && password !== passwordAgain/);
  assert.match(embeddedSignup, /setValue\('retypePassword', ''\)/);
  assert.match(embeddedSignup, /if \(!showPassword && data\.password !== data\.retypePassword\)/);
});

test('matching password confirmation shows a green tick', async () => {
  const [journey, embeddedSignup] = await Promise.all([
    read('src/supacharger/components/forms/login-user-form.tsx'),
    read('src/supacharger/components/forms/create-account-form.tsx'),
  ]);

  for (const form of [journey, embeddedSignup]) {
    assert.match(form, /passwordsMatch/);
    assert.match(form, /retypePassword\.length > 0|passwordAgain\.length > 0/);
    assert.match(form, /text-emerald-400/);
    assert.match(form, /<Check/);
  }
});

test('shared interactive controls consistently advertise pointer interaction', async () => {
  const styles = await read('src/supacharger/styles/supacharger.css');

  assert.match(styles, /a\[href\]/);
  assert.match(styles, /button:not\(:disabled\)/);
  assert.match(styles, /\[role='button'\]:not\(\[aria-disabled='true'\]\)/);
  assert.match(styles, /input\[type='submit'\]:not\(:disabled\)/);
  assert.match(styles, /cursor:\s*pointer\s*!important/);
});
