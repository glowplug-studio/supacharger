import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('managed security routes use authenticated server boundaries', async () => {
  const [page, security, emailRoute, passwordRoute] = await Promise.all([
    read('src/app/(supacharger)/(authenticated)/account/security/page.tsx'),
    read('src/supacharger/account/security/security-page.tsx'),
    read('src/app/(supacharger)/api/account/email/route.ts'),
    read('src/app/(supacharger)/api/(supacharger)/account/update-password/route.ts'),
  ]);
  assert.match(page, /SecurityPage/);
  assert.match(security, /auth\.getUser\(\)/);
  assert.match(security, /auth\.getClaims\(\)/);
  assert.match(security, /claims\.amr/);
  assert.match(security, /user\.new_email/);
  assert.match(emailRoute, /z\.object/);
  assert.match(emailRoute, /auth\.getUser\(\)/);
  assert.match(emailRoute, /signInWithPassword/);
  assert.match(emailRoute, /auth\.updateUser/);
  assert.match(passwordRoute, /safeParse/);
  assert.match(passwordRoute, /signInWithPassword/);
  assert.match(await read('src/supacharger/account/security/security-forms.tsx'), /PasswordValidationIndicator/);
});

test('TOTP management uses Supabase Auth without application secret storage', async () => {
  const panel = await read('src/supacharger/account/security/totp-panel.tsx');
  for (const operation of ['listFactors', 'enroll', 'challengeAndVerify', 'unenroll', 'getAuthenticatorAssuranceLevel']) {
    assert.match(panel, new RegExp(operation));
  }
  assert.doesNotMatch(panel, /insert\(|update\(|from\(['"].*mfa/i);
  assert.match(panel, /unverified|verified/);
});

test('required MFA is enforced for password, OTP, and callback sign-in completions', async () => {
  const [form, callback, challenge] = await Promise.all([
    read('src/supacharger/components/forms/login-user-form.tsx'),
    read('src/supacharger.adapters/auth-callback.ts'),
    read('src/supacharger/account/security/mfa-challenge-form.tsx'),
  ]);
  for (const source of [form, callback]) {
    assert.match(source, /REQUIRED_FOR_SIGN_IN/);
    assert.match(source, /getAuthenticatorAssuranceLevel/);
    assert.match(source, /\/account\/mfa/);
  }
  assert.match(challenge, /challengeAndVerify/);
  assert.match(challenge, /getSafeNextPath/);
});

test('security configuration and English copy are complete', async () => {
  const [contract, config, messages] = await Promise.all([
    read('src/supacharger/supacharger-config-contract.ts'),
    read('src/supacharger.config.ts'),
    read('messages/en.json').then(JSON.parse),
  ]);
  assert.match(contract, /REQUIRED_FOR_SIGN_IN: boolean/);
  assert.match(config, /REQUIRED_FOR_SIGN_IN:/);
  assert.equal(typeof messages.AuthJourney.mfaStatusFailed, 'string');
  assert.ok(messages.AuthJourney.mfaStatusFailed.trim());
  for (const section of ['providers', 'email', 'password', 'errors', 'mfa', 'mfaChallenge']) {
    assert.equal(typeof messages.AccountSecurity[section], 'object');
  }
});
