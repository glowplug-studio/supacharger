import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

const socialOAuthProviders = [
  'apple',
  'azure',
  'bitbucket',
  'discord',
  'facebook',
  'figma',
  'github',
  'gitlab',
  'google',
  'kakao',
  'keycloak',
  'linkedin_oidc',
  'notion',
  'twitch',
  'x',
  'twitter',
  'slack_oidc',
  'slack',
  'spotify',
  'workos',
  'zoom',
];

const authProviderIconFiles = [
  'apple-icon.svg',
  'bitbucket-icon.svg',
  'discord-icon.svg',
  'email-icon2.svg',
  'facebook-icon.svg',
  'figma-icon.svg',
  'github-icon.svg',
  'gitlab-icon.svg',
  'google-icon.svg',
  'kakao-icon.svg',
  'keycloak-icon.svg',
  'linkedin-icon.svg',
  'microsoft-icon.svg',
  'notion-icon.svg',
  'phone-icon4.svg',
  'saml-icon.svg',
  'slack-icon.svg',
  'spotify-icon.svg',
  'twitch-icon.svg',
  'twitter-icon.svg',
  'web3-icon.svg',
  'workos-icon.svg',
  'x-icon.svg',
  'zoom-icon.svg',
];

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

test('the application origin comes only from NEXT_PUBLIC_SITE_URL', async () => {
  const [siteUrl, config, helpers, auth] = await Promise.all([
    read('src/supacharger/utils/site-url.ts'),
    read('src/supacharger.config.ts'),
    read('src/supacharger/utils/helpers.ts'),
    read('src/lib/supabase/supacharger/supabase-auth.ts'),
  ]);

  assert.match(siteUrl, /process\.env\.NEXT_PUBLIC_SITE_URL/);
  assert.match(config, /SITE_URL:\s*getSiteUrl\(\)/);
  assert.match(helpers, /export \{ getSiteUrl, getURL \}/);
  assert.match(auth, /redirectTo:\s*getURL\('\/account\/reset-password\/new'\)/);

  for (const source of [siteUrl, helpers, auth]) {
    assert.doesNotMatch(source, /https?:\/\/localhost:\d+/);
    assert.doesNotMatch(source, /process\.env\.NEXT_PUBLIC_SITE_URL\s*\|\|/);
  }
  assert.doesNotMatch(config, /SITE_URL:\s*process\.env\.NEXT_PUBLIC_SITE_URL/);
});

test('social OAuth provider configuration, buttons, guards, and assets stay aligned', async () => {
  const [contract, buttons, auth] = await Promise.all([
    read('src/supacharger/supacharger-config-contract.ts'),
    read('src/supacharger/components/buttons/auth-provider-buttons.tsx'),
    read('src/lib/supabase/supacharger/supabase-auth.ts'),
  ]);

  for (const provider of socialOAuthProviders) {
    assert.ok(contract.includes(`'${provider}'`), `Missing ${provider} from the config contract`);
    assert.ok(buttons.includes(`key: '${provider}'`), `Missing ${provider} from the provider buttons`);
  }
  assert.match(contract, /Readonly<Record<SupachargerOAuthProvider, boolean>>/);
  assert.match(buttons, /assets\/images\/authProviderIcons/);
  assert.doesNotMatch(buttons, /socialAuthIcons/);
  assert.match(auth, /if \(!SC_CONFIG\.AUTH_PROVDERS_ENABLED\[provider\]\)/);

  await Promise.all(
    authProviderIconFiles.map((icon) =>
      access(new URL(`../src/assets/images/authProviderIcons/${icon}`, import.meta.url)),
    ),
  );
});

test('auth operations enforce config and align signup confirmation redirects', async () => {
  const auth = await read('src/lib/supabase/supacharger/supabase-auth.ts');
  assert.match(auth, /EMAIL_PASSWORD\.SIGN_IN/);
  assert.match(auth, /EMAIL_PASSWORD\.SIGN_UP/);
  assert.match(auth, /MAGIC_LINK\.ENABLED/);
  assert.match(auth, /shouldCreateUser:\s*SC_CONFIG\.AUTHENTICATION\.MAGIC_LINK\.ALLOW_SIGN_UP/);
  assert.match(auth, /function getSignUpConfirmationRedirect/);
  assert.equal((auth.match(/emailRedirectTo:\s*getSignUpConfirmationRedirect\(\)/g) ?? []).length, 2);
  assert.match(auth, /verifyOtp\([\s\S]*?type:\s*'signup'/);
});

test('consumed confirmation links recover through session-aware app or login notices', async () => {
  const [route, layout, notice, messages] = await Promise.all([
    read('src/app/(supacharger)/(unauthenticated)/auth/confirm/route.ts'),
    read('src/app/layout.tsx'),
    read('src/supacharger/components/auth/auth-confirmation-notice.tsx'),
    read('messages/en.json'),
  ]);

  assert.match(route, /supabase\.auth\.getUser\(\)/);
  assert.match(route, /user\?\.email_confirmed_at\s*\?\s*'already-authenticated'\s*:\s*'invalid'/);
  assert.doesNotMatch(route, /redirectTo\.pathname\s*=\s*'\/error'/);
  assert.match(layout, /<AuthConfirmationNotice\s*\/>/);
  assert.match(notice, /confirmationLinkAlreadyUsedSignedIn/);
  assert.match(notice, /confirmationLinkAlreadyUsedSignIn/);
  assert.match(messages, /"confirmationLinkAlreadyUsedSignIn"/);
});

test('client-facing auth operations return safe serialisable error codes', async () => {
  const [auth, journey, helpers] = await Promise.all([
    read('src/lib/supabase/supacharger/supabase-auth.ts'),
    read('src/supacharger/components/forms/login-user-form.tsx'),
    read('src/supacharger/utils/helpers.ts'),
  ]);

  assert.match(auth, /authActionFailure\(error\)/);
  assert.match(auth, /authActionSuccess\(\{[\s\S]*?userId:[\s\S]*?identityCount:/);
  assert.doesNotMatch(auth, /error:\s*new Error/);
  assert.doesNotMatch(auth, /return \{ data: null, error(?:: error)? \}/);
  assert.match(journey, /getAuthErrorMessage\(result\.error/);
  assert.match(helpers, /over_email_send_rate_limit:\s*'overEmailSendRateLimit'/);
});

test('shared journey supports password, magic link, OTP, and resend cooldown states', async () => {
  const [journey, resend] = await Promise.all([
    read('src/supacharger/components/forms/login-user-form.tsx'),
    read('src/supacharger/components/forms/resend-verification-email.tsx'),
  ]);
  assert.match(journey, /magicLinkAvailable/);
  assert.match(journey, /SIGN_UP_EMAIL_VERIFICATION === 'otp'/);
  assert.match(journey, /SIGN_UP_EMAIL_VERIFICATION === 'link'/);
  assert.match(journey, /autoComplete='one-time-code'/);
  assert.match(journey, /autoComplete='current-password'/);
  assert.match(resend, /EMAIL_RESEND_COOLDOWN_SECONDS/);
  assert.match(resend, /\/api\/account\/resend-activation-link/);
});

test('direct auth routes prefer providers while email-only authentication opens directly', async () => {
  const [journey, providerButtons, englishMessages, frenchMessages] = await Promise.all([
    read('src/supacharger/components/forms/login-user-form.tsx'),
    read('src/supacharger/components/buttons/auth-provider-buttons.tsx'),
    read('messages/en.json'),
    read('messages/fr.json'),
  ]);

  assert.match(journey, /startsInEmailMode/);
  assert.match(journey, /return emailJourneyAvailable && !providerJourneyAvailable/);
  assert.doesNotMatch(journey, /initialMode === 'signup' \|\| !providerJourneyAvailable/);
  assert.match(journey, /MAGIC_LINK\.ENABLED/);
  assert.match(journey, /MAGIC_LINK\.ALLOW_SIGN_UP/);
  assert.match(journey, /magicLinkAvailable\s*\?\s*\(/);
  assert.match(journey, /onClick=\{showProviderChoices\}/);
  assert.match(journey, /t\.has\('useSocialAuth'\)/);
  assert.doesNotMatch(journey, /showProvidersInEmailMode/);
  assert.match(providerButtons, /export function EnabledAuthProviderIcons/);
  assert.match(providerButtons, /slice\(0, limit\)/);
  assert.match(providerButtons, /-space-x-2/);
  assert.match(englishMessages, /"useSocialAuth":\s*"Use social auth"/);
  assert.match(frenchMessages, /"useSocialAuth":/);
});

test('the reusable embedded signup form retains the submitted email for OTP verification', async () => {
  const embeddedSignup = await read('src/supacharger/components/forms/create-account-form.tsx');

  assert.match(embeddedSignup, /setVerificationEmail\(data\.email\)/);
  assert.match(embeddedSignup, /<OtpFieldsForm email=\{verificationEmail\}/);
});

test('auth choices hide empty provider separators and track each request independently', async () => {
  const journey = await read('src/supacharger/components/forms/login-user-form.tsx');

  assert.match(journey, /providerJourneyAvailable/);
  assert.match(journey, /providerJourneyAvailable\s*\?\s*<UIDivider text='or'/);
  assert.match(journey, /pendingAction === 'password'/);
  assert.match(journey, /pendingAction === 'magic-link'/);
  assert.match(journey, /pendingAction === 'otp'/);
});

test('auth buttons and inputs share the canonical control dimensions', async () => {
  const styles = await read('src/supacharger/styles/supacharger.css');

  assert.match(
    styles,
    /\.sc-auth-surface-button,\s*\.sc-auth-primary-button,\s*\.sc-auth-input\s*\{[\s\S]*?height:\s*3\.5rem\s*!important;[\s\S]*?padding:\s*0\.75rem 1\.25rem\s*!important;/,
  );
});

test('signup is exposed through the canonical journey rather than a public JSON route', async () => {
  const route = new URL(
    '../src/app/(supacharger)/api/(supacharger)/account/create-account/route.ts',
    import.meta.url,
  );

  await assert.rejects(access(route));
});

test('logout uses the server route from a single dropdown control', async () => {
  const [button, menu] = await Promise.all([
    read('src/supacharger/components/buttons/logout-button.tsx'),
    read('src/components/sc_demo/sc_account-menu.tsx'),
  ]);

  assert.match(button, /fetch\('\/account\/logout'/);
  assert.doesNotMatch(button, /createClient|auth\.signOut/);
  assert.match(menu, /<DropdownMenuItem asChild>[\s\S]*?<LogoutButton/);
});

test('local development accepts the shared localhost auth-cookie budget', async () => {
  const packageJson = JSON.parse(await read('package.json'));
  assert.match(packageJson.scripts.dev, /--max-http-header-size=32768/);
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
