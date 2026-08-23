import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('every static AuthJourney key has non-empty English source copy', async () => {
  const [journey, resend, englishMessages] = await Promise.all([
    read('src/supacharger/components/forms/login-user-form.tsx'),
    read('src/supacharger/components/forms/resend-verification-email.tsx'),
    read('messages/en.json'),
  ]);
  const english = JSON.parse(englishMessages).AuthJourney;
  const keys = new Set(
    [...journey.matchAll(/\bt(?:\.has)?\('([^']+)'/g), ...resend.matchAll(/\bt(?:\.has)?\('([^']+)'/g)].map(
      (match) => match[1],
    ),
  );

  for (const key of keys) {
    assert.equal(typeof english[key], 'string', `English AuthJourney.${key} is missing`);
    assert.notEqual(english[key].trim(), '', `English AuthJourney.${key} is empty`);
  }
});

test('new passwordless copy has safe English fallbacks during catalogue hot reloads', async () => {
  const journey = await read('src/supacharger/components/forms/login-user-form.tsx');

  for (const key of ['passwordlessSignInUnavailable', 'passwordlessOtp', 'signInCodeSent', 'enterSignInCode']) {
    assert.match(journey, new RegExp(`t\\.has\\('${key}'\\)`), `AuthJourney.${key} needs a hot-reload fallback`);
  }
});

test('passwordless OTP login uses login-code copy without changing signup confirmation copy', async () => {
  const [journey, resend, englishMessages] = await Promise.all([
    read('src/supacharger/components/forms/login-user-form.tsx'),
    read('src/supacharger/components/forms/resend-verification-email.tsx'),
    read('messages/en.json'),
  ]);

  assert.match(journey, /onFormHeadingChange\?\.\(enterSignInCodeLabel\)/);
  assert.match(journey, /purpose=\{verificationPurpose === 'signin' \? 'signin-code' : 'signup'\}/);
  assert.match(resend, /purpose === 'signin-code'/);
  assert.match(resend, /signInCodeResendSuccessLabel/);
  assert.match(englishMessages, /"enterSignInCode":\s*"Enter your login code"/);
  assert.match(englishMessages, /"signInCodeResendSuccess":\s*"A new login code has been sent\."/);
  assert.match(englishMessages, /"enterCode":\s*"Enter your confirmation code"/);
  assert.match(englishMessages, /"resendSuccess":\s*"A new confirmation email has been sent\."/);
});

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

test('OTP fields retain an independent placeholder for each empty slot', async () => {
  const [field, styles] = await Promise.all([
    read('src/components/ui/otp-field.tsx'),
    read('src/supacharger/styles/supacharger.css'),
  ]);

  assert.match(field, /placeholder \?\? '0'\.repeat\(length\)/);
  assert.match(field, /displayValue\[index\]/);
  assert.match(field, /focusedIndex !== index/);
  assert.match(field, /onFocus=\{\(\) => setFocusedIndex\(index\)\}/);
  assert.match(field, /onBlur=/);
  assert.match(field, /otp-field-placeholder/);
  assert.doesNotMatch(field, /placeholder=\{resolvedPlaceholder\}/);
  assert.match(field, /index=\{index\}/);
  assert.match(field, /aria-hidden='true'/);
  assert.match(styles, /\.sc-auth-otp \.otp-field-placeholder/);
  assert.match(styles, /aspect-ratio: 1 \/ 1/);
  assert.match(styles, /clamp\(2\.25rem, 12vw, 3\.75rem\)/);
  assert.match(styles, /color: rgb\(255 255 255 \/ 0\.18\)/);
  assert.doesNotMatch(field, /otp-field-separator/);
});

test('bright auth actions use the black inline-loader variant', async () => {
  const [spinner, journey, darkLoader] = await Promise.all([
    read('src/components/ui/loading-spinner.tsx'),
    read('src/supacharger/components/forms/login-user-form.tsx'),
    read('src/assets/svgr/ui/inline-loader-dark.svg'),
  ]);

  assert.match(spinner, /inline-loader-dark\.svg/);
  assert.match(spinner, /variant === 'dark'/);
  assert.equal((journey.match(/variant='dark'/g) ?? []).length, 2);
  assert.match(darkLoader, /fill="#000000"/);
});

test('responsive inline loader assets retain their SVG scaling coordinate system', async () => {
  const loaders = await Promise.all([
    read('src/assets/svgr/ui/inline-loader.svg'),
    read('src/assets/svgr/ui/inline-loader-dark.svg'),
  ]);

  for (const loader of loaders) {
    assert.match(loader, /viewBox=/);
    assert.doesNotMatch(loader, /<svg[^>]*\swidth=/);
    assert.doesNotMatch(loader, /<svg[^>]*\sheight=/);
  }
});

test('protected auth provider SVGs are responsive SVGR sources', async () => {
  const directory = new URL('../src/supacharger/assets/svgr/auth-providers/', import.meta.url);
  const filenames = (await readdir(directory)).filter((filename) => filename.endsWith('.svg'));

  for (const filename of filenames) {
    const source = await readFile(new URL(filename, directory), 'utf8');
    const root = source.match(/<svg\b[^>]*>/s)?.[0] ?? '';

    assert.match(root, /\bviewBox=/, `${filename} must retain a viewBox`);
    assert.doesNotMatch(root, /\swidth=/, `${filename} must not set an intrinsic width`);
    assert.doesNotMatch(root, /\sheight=/, `${filename} must not set an intrinsic height`);
  }
});

test('password reset retains its managed request logic and shared presentation classes', async () => {
  const form = await read('src/supacharger/components/forms/reset-password-request-link-form.tsx');

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
    assert.match(form, /left-\[calc\(100%\+0\.5rem\)\]/);
    assert.match(form, /text-green-500/);
    assert.match(form, /size=\{17\}/);
    assert.match(form, /strokeWidth=\{2\.5\}/);
    assert.match(form, /<Check/);
    assert.doesNotMatch(form, /text-emerald-400/);
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

test('auth messages use the standard form text size', async () => {
  const styles = await read('src/supacharger/styles/supacharger.css');
  const messageRule = styles.match(/\.sc_message\s*\{([\s\S]*?)\}/);
  const errorRule = styles.match(/\.sc_message-error\s*\{([\s\S]*?)\}/);

  assert.ok(messageRule, 'expected the shared message style');
  assert.ok(errorRule, 'expected the shared error-message style');
  assert.match(messageRule[1], /text-sm/);
  assert.doesNotMatch(messageRule[1], /text-xs/);
  assert.match(errorRule[1], /text-center/);
});

test('social-auth logos use the auth colours and the compact stack stays left-aligned', async () => {
  const [providers, journey, styles] = await Promise.all([
    read('src/supacharger/components/buttons/auth-provider-buttons.tsx'),
    read('src/supacharger/components/forms/login-user-form.tsx'),
    read('src/supacharger/styles/supacharger.css'),
  ]);

  assert.equal((providers.match(/className='sc-auth-provider-avatar/g) ?? []).length, 2);
  assert.doesNotMatch(providers, /border-slate-950 bg-white/);
  assert.match(providers, /className='sc-auth-surface-button sc-auth-provider-button/);
  assert.match(journey, /className='sc-auth-surface-button sc-auth-provider-switcher/);
  assert.match(journey, /<span className='justify-self-start'>[\s\S]*?<EnabledAuthProviderIcons limit=\{3\}/);
  assert.match(
    styles,
    /\.sc-auth-provider-avatar\s*\{[\s\S]*?background:\s*var\(--auth-input-background,[\s\S]*?border-color:\s*var\(--auth-surface-background,/,
  );
  assert.match(
    styles,
    /\.sc-auth-provider-button\s*\{[\s\S]*?display:\s*grid\s*!important;[\s\S]*?grid-template-columns:\s*2rem minmax\(0, 1fr\) 2rem;[\s\S]*?align-items:\s*center;/,
  );
  assert.match(
    styles,
    /\.sc-auth-provider-switcher\s*\{[\s\S]*?display:\s*grid\s*!important;[\s\S]*?grid-template-columns:\s*4rem minmax\(0, 1fr\) 4rem;[\s\S]*?align-items:\s*center;/,
  );
});

test('email verification follows the SnapScreen OTP presentation', async () => {
  const [journey, resend, styles, englishMessages] = await Promise.all([
    read('src/supacharger/components/forms/login-user-form.tsx'),
    read('src/supacharger/components/forms/resend-verification-email.tsx'),
    read('src/supacharger/styles/supacharger.css'),
    read('messages/en.json'),
  ]);

  assert.match(journey, /sc-auth-surface space-y-4 px-4 py-6 text-center sm:px-6/);
  assert.match(journey, /sc-auth-surface space-y-5/);
  assert.match(journey, /<LoadingSpinner className='h-6 w-6 text-white'/);
  assert.match(journey, /otpVerificationSucceeded \? 'scale-95 opacity-0'/);
  assert.match(journey, /otpVerificationSucceeded \? 'scale-100 opacity-100'/);
  assert.match(journey, /rounded-full bg-green-600/);
  assert.match(journey, /<Check className='h-7 w-7 text-white'/);
  assert.match(journey, /OTP_SUCCESS_REDIRECT_DELAY_MS/);
  assert.match(journey, /t\.has\('loginHere'\)/);
  assert.match(journey, /'Login Here'/);
  assert.match(resend, /justify-between/);
  assert.match(resend, /text-primary/);
  assert.match(resend, /<ArrowRight/);
  assert.match(resend, /t\('sendAnother'\)/);
  assert.match(resend, /secondsRemaining > 0 \? \(/);
  assert.match(resend, /text-white\/50/);
  assert.match(resend, /t\('sendAgainIn', \{ seconds: secondsRemaining \}\)/);
  assert.match(resend, /<MailCheck/);
  assert.match(resend, /rounded-full bg-green-600/);
  assert.match(resend, /h-4 w-4 text-white/);
  assert.match(resend, /sc_message-positive/);
  assert.match(styles, /\.sc_message-positive[\s\S]*?bg-green-100/);
  assert.match(englishMessages, /"codeAndLinkSent":\s*"We sent an email to \{email\}\."/);
  assert.match(englishMessages, /"enterCodeOption":\s*"Enter the Code here"/);
  assert.match(englishMessages, /"sendAnother":\s*"Send again"/);
});

test('magic-link delivery uses one icon-led success message', async () => {
  const [journey, englishMessages] = await Promise.all([
    read('src/supacharger/components/forms/login-user-form.tsx'),
    read('messages/en.json'),
  ]);

  const checkEmailState = journey.match(/if \(step === 'check-email'\) \{([\s\S]*?)\n  \}/);

  assert.ok(checkEmailState, 'expected a dedicated magic-link delivery state');
  assert.match(checkEmailState[1], /sc_message sc_message-positive/);
  assert.match(checkEmailState[1], /role='status'/);
  assert.match(checkEmailState[1], /<MailCheck/);
  assert.match(checkEmailState[1], /rounded-full bg-green-600/);
  assert.match(checkEmailState[1], /t\('linkSent', \{ email: verificationEmail \}\)/);
  assert.doesNotMatch(checkEmailState[1], /<h2/);
  assert.match(
    englishMessages,
    /"linkSent":\s*"We sent a secure link to \{email\}\. Click the button in the email to get logged in\."/,
  );
});

test('failed password sign in shows an icon-led create-account recovery', async () => {
  const [journey, englishMessages] = await Promise.all([
    read('src/supacharger/components/forms/login-user-form.tsx'),
    read('messages/en.json'),
  ]);

  assert.match(journey, /messageKey === 'invalidCredentials'/);
  assert.match(journey, /setLoginFailed\(mode === 'signin'/);
  assert.match(journey, /<X/);
  assert.match(journey, /rounded-full bg-red-600/);
  assert.match(journey, /h-4 w-4 text-white/);
  assert.match(journey, /t\.has\('createAccountInstead'\)/);
  assert.match(journey, /'Create Account instead'/);
  assert.match(journey, /onClick=\{\(\) => switchAuthMode\('signup'\)\}/);
  assert.match(journey, /<ArrowRight/);
  assert.match(journey, /sc_message sc_message-error/);
  assert.match(journey, /flex items-center justify-center gap-3/);
  assert.match(journey, /sc-auth-recovery-link text-primary/);
  assert.doesNotMatch(journey, /\{!loginFailed \? \(/);
  assert.match(englishMessages, /"createAccountInstead":\s*"Create Account instead"/);
});

test('unverified password sign in offers a fresh verification email and enters the OTP journey', async () => {
  const [journey, englishMessages] = await Promise.all([
    read('src/supacharger/components/forms/login-user-form.tsx'),
    read('messages/en.json'),
  ]);

  assert.match(journey, /messageKey === 'emailNotConfirmed'/);
  assert.match(journey, /\/api\/account\/resend-activation-link/);
  assert.match(journey, /setVerificationEmail\(normalisedEmail\)/);
  assert.match(journey, /setStep\('verify-email'\)/);
  assert.match(journey, /emailNotConfirmed && error/);
  assert.equal((journey.match(/sc-auth-recovery-link/g) ?? []).length, 2);
  assert.match(journey, /space-y-3/);
  assert.match(journey, /getVerificationLinkLabel/);
  assert.match(englishMessages, /"getVerificationLink":\s*"Get verification link"/);
});
