import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('configuration exposes the canonical authentication and onboarding policies', async () => {
  const contract = await read('src/supacharger/supacharger-config-contract.ts');
  assert.match(contract, /SIGN_UP_EMAIL_VERIFICATION:\s*'disabled' \| 'link' \| 'otp'/);
  assert.match(contract, /USERNAME:\s*'disabled' \| 'optional' \| 'required'/);
  assert.match(contract, /POST_SIGN_IN_ONBOARDING/);
  assert.match(contract, /AUTHENTICATION_HANDLE:\s*'disabled' \| 'optional' \| 'required'/);
  assert.match(contract, /MOBILE_DEEP_LINKING/);
  assert.match(contract, /APP_IDS:\s*readonly string\[\]/);
  assert.match(contract, /SHA256_CERT_FINGERPRINTS:\s*readonly string\[\]/);
});

test('auth operations enforce config and use the signup OTP contract', async () => {
  const auth = await read('src/lib/supabase/supacharger/supabase-auth.ts');
  assert.match(auth, /EMAIL_PASSWORD\.SIGN_IN/);
  assert.match(auth, /EMAIL_PASSWORD\.SIGN_UP/);
  assert.match(auth, /MAGIC_LINK\.ENABLED/);
  assert.match(auth, /shouldCreateUser:\s*SC_CONFIG\.AUTHENTICATION\.MAGIC_LINK\.ALLOW_SIGN_UP/);
  assert.match(auth, /verifyOtp\([\s\S]*?type:\s*'signup'/);
});

test('shared journey supports password, magic link, OTP, and resend cooldown states', async () => {
  const [journey, resend] = await Promise.all([
    read('src/supacharger/components/forms/login-user-form.tsx'),
    read('src/supacharger/components/forms/resend-verification-email.tsx'),
  ]);
  assert.match(journey, /magicLinkAvailable/);
  assert.match(journey, /SIGN_UP_EMAIL_VERIFICATION === 'otp'/);
  assert.match(journey, /autoComplete='one-time-code'/);
  assert.match(journey, /autoComplete='current-password'/);
  assert.match(resend, /EMAIL_RESEND_COOLDOWN_SECONDS/);
  assert.match(resend, /\/api\/account\/resend-activation-link/);
});

test('mobile auth associations are generated from application configuration', async () => {
  const [association, appleRoute, androidRoute, proxy] = await Promise.all([
    read('src/supacharger/auth/mobile-deep-linking.ts'),
    read('src/app/(supacharger)/.well-known/apple-app-site-association/route.ts'),
    read('src/app/(supacharger)/.well-known/assetlinks.json/route.ts'),
    read('src/proxy.ts'),
  ]);

  assert.match(association, /appIDs/);
  assert.match(association, /components/);
  assert.match(association, /delegate_permission\/common\.handle_all_urls/);
  assert.match(association, /Content-Type': 'application\/json'/);
  assert.match(appleRoute, /SC_CONFIG\.MOBILE_DEEP_LINKING/);
  assert.match(androidRoute, /SC_CONFIG\.MOBILE_DEEP_LINKING/);
  assert.match(proxy, /\\\.well-known/);
});
