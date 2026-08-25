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
  const [contract, config] = await Promise.all([
    read('src/supacharger/supacharger-config-contract.ts'),
    read('src/supacharger.config.ts'),
  ]);
  assert.match(contract, /EmailPasswordlessMode = 'disabled' \| 'link' \| 'otp'/);
  assert.match(contract, /EmailOtpLength = 6 \| 7 \| 8 \| 9 \| 10/);
  assert.match(contract, /SignUpEmailVerificationMode = EmailPasswordlessMode \| 'otp-and-link'/);
  assert.match(contract, /PASSWORDLESS_EMAIL:[\s\S]*?SIGN_IN: EmailPasswordlessMode/);
  assert.match(contract, /OTP_LENGTH: EmailOtpLength/);
  assert.match(contract, /SIGN_UP_EMAIL_VERIFICATION: SignUpEmailVerificationMode/);
  assert.match(contract, /USERNAME:\s*'disabled' \| 'optional' \| 'required'/);
  assert.match(contract, /POST_SIGN_IN_ONBOARDING/);
  assert.match(contract, /AUTHENTICATION_HANDLE:\s*'disabled' \| 'optional' \| 'required'/);
  assert.match(contract, /MOBILE_DEEP_LINKING/);
  assert.match(contract, /APP_IDS:\s*readonly string\[\]/);
  assert.match(contract, /SHA256_CERT_FINGERPRINTS:\s*readonly string\[\]/);
  for (const source of [contract, config]) {
    assert.doesNotMatch(source, /ACCOUNT_FORCE_SUBSCRIPTION/);
    assert.doesNotMatch(source, /ACCOUNT_ENFORCE_SUBSCRIPTION_PATH/);
  }
});

test('server-importable configuration contains no react-toastify runtime values', async () => {
  const [contract, config, resolver] = await Promise.all([
    read('src/supacharger/supacharger-config-contract.ts'),
    read('src/supacharger.config.ts'),
    read('src/supacharger/components/notifications/toast-options.ts'),
  ]);

  assert.doesNotMatch(contract, /from 'react-toastify'/);
  assert.doesNotMatch(config, /from 'react-toastify'|\bFlip\b/);
  assert.match(config, /transition:\s*['"]flip['"]/);
  assert.match(resolver, /flip:\s*Flip/);
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
  assert.match(auth, /redirectTo:\s*getURL\('\/auth\/callback\?flow=recovery'\)/);

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
  assert.match(buttons, /supacharger\/assets\/svgr\/auth-providers/);
  assert.doesNotMatch(buttons, /socialAuthIcons/);
  assert.match(auth, /if \(!SC_CONFIG\.AUTH_PROVDERS_ENABLED\[provider\]\)/);

  await Promise.all(
    authProviderIconFiles.map((icon) =>
      access(new URL(`../src/supacharger/assets/svgr/auth-providers/${icon}`, import.meta.url)),
    ),
  );
});

test('auth operations enforce config and align signup confirmation redirects', async () => {
  const [auth, journey, config, englishMessages] = await Promise.all([
    read('src/lib/supabase/supacharger/supabase-auth.ts'),
    read('src/supacharger/components/forms/login-user-form.tsx'),
    read('src/supacharger.config.ts'),
    read('messages/en.json'),
  ]);
  assert.match(auth, /EMAIL_PASSWORD\.SIGN_IN/);
  assert.match(auth, /EMAIL_PASSWORD\.SIGN_UP/);
  assert.match(auth, /PASSWORDLESS_EMAIL\.SIGN_IN/);
  assert.match(auth, /export async function signInWithEmail\(email: string, nextPath:/);
  assert.match(auth, /export async function signUpWithEmail\(email: string, nextPath:/);
  assert.match(auth, /signInWithEmail[\s\S]*?sendPasswordlessEmail\(email, false, nextPath\)/);
  assert.match(auth, /function getPasswordlessConfirmationRedirect/);
  assert.match(
    auth,
    /getPasswordlessConfirmationRedirect[\s\S]*?LOGIN_REDIRECT_DESTINATION[\s\S]*?getURL\(`\/auth\/confirm\?next=/,
  );
  assert.match(auth, /emailRedirectTo:\s*getPasswordlessConfirmationRedirect\(nextPath\)/);
  assert.doesNotMatch(auth, /emailRedirectTo:\s*getURL\('\/auth\/callback'\)/);
  assert.match(auth, /signInWithOAuth[\s\S]*?redirectTo:\s*getURL\('\/auth\/callback'\)/);
  assert.match(
    auth,
    /signUpWithEmail[\s\S]*?PASSWORDLESS_EMAIL\.SIGN_UP[\s\S]*?sendPasswordlessEmail\(email, true, nextPath\)/,
  );
  assert.match(
    config,
    /PASSWORDLESS_EMAIL:[\s\S]*?SIGN_IN:\s*['"](?:disabled|link|otp)['"][\s\S]*?SIGN_UP:\s*['"](?:disabled|link|otp)['"]/,
  );
  assert.doesNotMatch(journey, /signUpWithEmail/);
  assert.match(journey, /const result = await signInWithEmail\(normalisedEmail, safeNextPath\)/);
  assert.match(journey, /result\.error\.code === 'otp_disabled'/);
  assert.match(journey, /t\('passwordlessSignInUnavailable'\)/);
  assert.match(journey, /result\.error\.code === 'otp_disabled'[\s\S]*?\? passwordlessSignInUnavailableLabel/);
  assert.match(
    englishMessages,
    /"passwordlessSignInUnavailable":\s*"We couldn’t send a sign-in email\. Check the email address, or create an account instead\."/,
  );
  assert.match(auth, /function getSignUpConfirmationRedirect/);
  assert.match(auth, /getSignUpConfirmationRedirect\(nextPath\)/);
  assert.match(journey, /createUserByEmailPassword\(formData\)/);
  assert.doesNotMatch(journey, /auth\.signUp\(/);
  assert.match(auth, /signUpPasswordSchema/);
  assert.match(auth, /evaluatePasswordStrength\(password\)\.valid/);
  assert.match(auth, /verifyOtp\([\s\S]*?type:\s*'signup'/);
  assert.match(auth, /verifySignInOtp\([\s\S]*?type:\s*'email'/);
});

test('consumed confirmation links recover through session-aware app or login notices', async () => {
  const [route, serverClient, notice, messages] = await Promise.all([
    read('src/app/(supacharger)/(unauthenticated)/auth/confirm/route.ts'),
    read('src/lib/supabase/server.ts'),
    read('src/supacharger/components/auth/auth-confirmation-notice.tsx'),
    read('messages/en.json'),
  ]);

  assert.equal((route.match(/await createClient\(\)/g) ?? []).length, 1);
  assert.match(route, /const supabase = await createClient\(\)/);
  assert.match(route, /supabase\.auth\.verifyOtp\(/);
  assert.match(route, /supabase\.auth\.getUser\(\)/);
  assert.doesNotMatch(route, /readSessionCookies/);
  assert.doesNotMatch(serverClient, /CreateClientOptions|readSessionCookies/);
  assert.match(serverClient, /getAll\(\)\s*\{\s*return cookieStore\.getAll\(\)/);
  assert.match(route, /user\?\.email_confirmed_at\s*\?\s*'already-authenticated'\s*:\s*'invalid'/);
  assert.doesNotMatch(route, /redirectTo\.pathname\s*=\s*'\/error'/);
  assert.match(notice, /confirmationLinkAlreadyUsedSignedIn/);
  assert.match(notice, /confirmationLinkAlreadyUsedSignIn/);
  assert.match(notice, /toastId:\s*confirmationToastId/);
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

test('local passwordless and signup templates match their independent configured modes', async () => {
  const [appConfig, config, template, magicLinkTemplate] = await Promise.all([
    read('src/supacharger.config.ts'),
    read('supabase/config.toml'),
    read('supabase/templates/confirmation.html'),
    read('supabase/templates/magic_link.html'),
  ]);

  const enableConfirmations =
    config.match(/\[auth\.email\][\s\S]*?enable_confirmations\s*=\s*(true|false)/)?.[1] === 'true';
  assert.match(
    config,
    /\[auth\.email\.template\.confirmation\][\s\S]*?content_path\s*=\s*"\.\/supabase\/templates\/confirmation\.html"/,
  );
  const signupMode = appConfig.match(/SIGN_UP_EMAIL_VERIFICATION:\s*['"]([^'"]+)['"]/)?.[1];
  assert.ok(['disabled', 'otp', 'link', 'otp-and-link'].includes(signupMode));
  assert.equal(enableConfirmations, signupMode !== 'disabled');
  if (signupMode === 'otp' || signupMode === 'otp-and-link') assert.match(template, /\{\{ \.Token \}\}/);
  if (signupMode === 'link' || signupMode === 'otp-and-link') {
    assert.match(template, /\{\{ \.RedirectTo \}\}/);
    assert.match(template, /\{\{ \.TokenHash \}\}/);
    assert.match(template, /type=email/);
  }
  assert.match(config, /\[auth\.email\.template\.magic_link\][\s\S]*?magic_link\.html/);
  assert.match(magicLinkTemplate, /\{\{ \.Token \}\}/);
  assert.doesNotMatch(magicLinkTemplate, /\{\{ \.RedirectTo \}\}|\{\{ \.TokenHash \}\}|type=email/);
});

test('shared journey supports password, passwordless email, OTP, and resend cooldown states', async () => {
  const [auth, journey, resend, helpers, englishMessages] = await Promise.all([
    read('src/lib/supabase/supacharger/supabase-auth.ts'),
    read('src/supacharger/components/forms/login-user-form.tsx'),
    read('src/supacharger/components/forms/resend-verification-email.tsx'),
    read('src/supacharger/utils/helpers.ts'),
    read('messages/en.json'),
  ]);
  assert.match(journey, /passwordlessEmailAvailable/);
  assert.match(journey, /signUpVerificationMode === 'otp'/);
  assert.match(journey, /signUpVerificationMode === 'link'/);
  assert.match(journey, /signUpVerificationMode === 'otp-and-link'/);
  assert.match(journey, /offersOtpAndLink/);
  assert.match(journey, /openLinkInstructions/);
  assert.doesNotMatch(journey, /passwordlessEmailMode === 'otp-and-link'/);
  assert.match(journey, /autoComplete='one-time-code'/);
  assert.match(journey, /autoComplete='current-password'/);
  const verifyOtpAction = auth.slice(auth.indexOf('export async function verifyOtp'));
  assert.ok(
    verifyOtpAction.indexOf('supabase.auth.getUser()') < verifyOtpAction.indexOf('supabase.auth.verifyOtp('),
    'an existing verified session must be recognised before submitting a consumed OTP',
  );
  assert.equal((verifyOtpAction.match(/supabase\.auth\.getUser\(\)/g) ?? []).length, 2);
  assert.match(auth, /supabase\.auth\.getUser\(\)/);
  assert.match(auth, /hasVerifiedSessionForEmail/);
  assert.match(auth, /authActionFailure\('otp_already_verified'\)/);
  assert.match(helpers, /otp_already_verified:\s*'otpAlreadyVerified'/);
  assert.match(journey, /messageKey === 'otpExpired'/);
  assert.match(journey, /messageKey === 'otpAlreadyVerified'/);
  assert.match(journey, /otpFailure === 'already-verified' \? 'sc_message-positive' : 'sc_message-error'/);
  assert.match(journey, /withNextPath\('\/account\/login', safeNextPath\)/);
  assert.match(journey, /t\('loginHere'\)/);
  assert.match(journey, /otpFailure && verificationPurpose === 'signup'/);
  assert.match(englishMessages, /"otpAlreadyVerified":\s*"Your email has already been verified\."/);
  assert.match(englishMessages, /"loginHere":\s*"Login Here"/);
  assert.match(resend, /EMAIL_RESEND_COOLDOWN_SECONDS/);
  assert.match(resend, /\/api\/account\/resend-activation-link/);
  assert.match(resend, /onResend/);
});

test('the application selects a supported passwordless sign-in mode independently of signup verification', async () => {
  const config = await read('src/supacharger.config.ts');

  assert.match(config, /SIGN_IN:\s*['"](?:disabled|link|otp)['"]/);
  assert.match(config, /SIGN_UP_EMAIL_VERIFICATION:\s*['"](?:disabled|otp|link|otp-and-link)['"]/);
});

test('frontend and local Supabase use the same email OTP length', async () => {
  const [appConfig, supabaseConfig, journey, auth] = await Promise.all([
    read('src/supacharger.config.ts'),
    read('supabase/config.toml'),
    read('src/supacharger/components/forms/login-user-form.tsx'),
    read('src/lib/supabase/supacharger/supabase-auth.ts'),
  ]);
  const frontendLength = Number(appConfig.match(/OTP_LENGTH:\s*(\d+)/)?.[1]);
  const localLength = Number(supabaseConfig.match(/\[auth\.email\][\s\S]*?otp_length\s*=\s*(\d+)/)?.[1]);

  assert.ok(Number.isInteger(frontendLength) && frontendLength > 0);
  assert.equal(frontendLength, localLength);
  assert.match(journey, /length=\{otpLength\}/);
  assert.match(auth, /\.length\(SC_CONFIG\.AUTHENTICATION\.PASSWORDLESS_EMAIL\.OTP_LENGTH\)/);
});

test('direct auth routes prefer providers while email-only authentication opens directly', async () => {
  const [journey, providerButtons, englishMessages] = await Promise.all([
    read('src/supacharger/components/forms/login-user-form.tsx'),
    read('src/supacharger/components/buttons/auth-provider-buttons.tsx'),
    read('messages/en.json'),
  ]);

  assert.match(journey, /startsInEmailMode/);
  assert.match(journey, /return emailJourneyAvailable && !providerJourneyAvailable/);
  assert.doesNotMatch(journey, /initialMode === 'signup' \|\| !providerJourneyAvailable/);
  assert.match(journey, /PASSWORDLESS_EMAIL\.SIGN_IN/);
  assert.match(journey, /PASSWORDLESS_EMAIL\.SIGN_UP/);
  assert.match(journey, /passwordlessEmailAvailable\s*\?\s*\(/);
  assert.match(journey, /onClick=\{showProviderChoices\}/);
  assert.match(journey, /t\.has\('useSocialAuth'\)/);
  assert.doesNotMatch(journey, /showProvidersInEmailMode/);
  assert.match(providerButtons, /export function EnabledAuthProviderIcons/);
  assert.match(providerButtons, /slice\(0, limit\)/);
  assert.match(providerButtons, /sc-auth-provider-stack/);
  assert.match(englishMessages, /"useSocialAuth":\s*"Use social auth"/);
});

test('the reusable embedded signup form retains the submitted email for OTP verification', async () => {
  const embeddedSignup = await read('src/supacharger/components/forms/create-account-form.tsx');

  assert.match(embeddedSignup, /setVerificationEmail\(data\.email\)/);
  assert.match(embeddedSignup, /<OtpFieldsForm email=\{verificationEmail\}/);
});

test('an existing signup returns to sign in with the submitted credentials intact', async () => {
  const journey = await read('src/supacharger/components/forms/login-user-form.tsx');
  const transition = journey.match(
    /if \(result\.data\.userId && result\.data\.identityCount === 0\) \{([\s\S]*?)\n        \}/,
  );

  assert.ok(transition, 'expected an existing-account sign-in transition');
  assert.match(journey, /result\.data\.identityCount === 0/);
  assert.match(
    journey,
    /toast\.warning\(tSupabaseErrorCodes\('accountAlreadyExists'\), resolveToastOptions\(SC_CONFIG\.TOAST_CONFIG\)\)/,
  );
  assert.match(transition[1], /setMode\('signin'\)/);
  assert.match(transition[1], /setStep\('email'\)/);
  assert.match(transition[1], /pushAuthRoute\('signin'\)/);
  assert.match(transition[1], /setPasswordAgain\(''\)/);
  assert.doesNotMatch(transition[1], /setPassword\(/);
});

test('auth choices hide empty provider separators and track each request independently', async () => {
  const journey = await read('src/supacharger/components/forms/login-user-form.tsx');

  assert.match(journey, /providerJourneyAvailable/);
  assert.match(journey, /providerJourneyAvailable\s*\?\s*<UIDivider text='or'/);
  assert.match(journey, /pendingAction === 'password'/);
  assert.match(journey, /pendingAction === 'passwordless-email'/);
  assert.match(journey, /pendingAction === 'otp'/);
});

test('password signup uses the validated Server Action and one explicit verification step', async () => {
  const [journey, auth] = await Promise.all([
    read('src/supacharger/components/forms/login-user-form.tsx'),
    read('src/lib/supabase/supacharger/supabase-auth.ts'),
  ]);

  assert.match(journey, /import \{ useState, useTransition \} from 'react'/);
  assert.match(journey, /await createUserByEmailPassword\(formData\)/);
  assert.doesNotMatch(journey, /await supabase\.auth\.signUp\(/);
  assert.match(auth, /await supabase\.auth\.signUp\(/);
  assert.match(auth, /signUpPasswordSchema/);
  assert.match(journey, /setVerificationEmail\(normalisedEmail\)/);
  assert.match(journey, /setStep\('verify-email'\)/);
  assert.doesNotMatch(journey, /useActionState|signUpActionState|signUpFormAction|submissionId/);
  assert.doesNotMatch(auth, /submitEmailPasswordSignUp|EmailPasswordSignUpActionState/);
  assert.equal((journey.match(/startAuthTransition\(async \(\) => \{/g) ?? []).length, 4);
  assert.match(
    journey,
    /startAuthTransition\(async \(\) => \{[\s\S]*?await signInWithEmail\(normalisedEmail, safeNextPath\)/,
  );
  assert.match(journey, /startAuthTransition\(async \(\) => \{[\s\S]*?await verifyOtp\(verificationEmail, value\)/);
});

test('auth buttons and inputs share the canonical control dimensions', async () => {
  const styles = await read('src/styles/supacharger-auth.css');

  assert.match(
    styles,
    /\.sc-auth-surface-button,\s*\.sc-auth-primary-button,\s*\.sc-auth-input,\s*\.sc-auth-page \.sc-control-input\s*\{[\s\S]*?min-height:\s*3\.5rem;[\s\S]*?padding:\s*0\.75rem 1\.25rem;/,
  );
});

test('signup is exposed through the canonical journey rather than a public JSON route', async () => {
  const route = new URL('../src/app/(supacharger)/api/(supacharger)/account/create-account/route.ts', import.meta.url);

  await assert.rejects(access(route));
});

test('logout uses the server route from a single dropdown control', async () => {
  const [button, menu, route] = await Promise.all([
    read('src/supacharger/components/buttons/logout-button.tsx'),
    read('src/components/sc_demo/sc_account-menu.tsx'),
    read('src/app/(supacharger)/(unauthenticated)/account/logout/route.ts'),
  ]);

  assert.match(button, /fetch\('\/account\/logout'/);
  assert.match(button, /await response\.json\(\)/);
  assert.match(button, /window\.location\.assign\(logoutResult\.redirectTo/);
  assert.doesNotMatch(button, /response\.url/);
  assert.doesNotMatch(button, /createClient|auth\.signOut/);
  assert.match(menu, /<DropdownMenuItem asChild>[\s\S]*?<LogoutButton/);
  assert.match(route, /getSafeNextPath/);
  assert.match(route, /status:\s*303/);
  assert.match(route, /Location:\s*logoutResult\.redirectTo/);
  assert.match(route, /export async function POST\(\): Promise<NextResponse>/);
  assert.match(route, /NextResponse\.json\(logoutResult/);
  assert.doesNotMatch(route, /getURL|nextUrl\.origin/);
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
