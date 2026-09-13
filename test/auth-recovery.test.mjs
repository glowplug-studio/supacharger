import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { test } from 'node:test';
import ts from 'typescript';
import { NextRequest } from 'next/server.js';

const require = createRequire(import.meta.url);
function load(relative, mocks = {}) {
  let file = new URL(`../${relative}`, import.meta.url);
  if (!existsSync(file)) file = new URL(file.href.replace(/\.ts$/, '.js'));
  const { outputText } = ts.transpileModule(readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  });
  const module = { exports: {} };
  new Function('require', 'module', 'exports', outputText)(
    (name) => {
      if (name in mocks) return mocks[name];
      if (name.startsWith('@/')) return load(`src/${name.slice(2)}.ts`, mocks);
      if (name.startsWith('.')) {
        const target = new URL(name.replace(/\.js$/, '.ts'), file);
        return load(target.pathname.split('/supacharger/').slice(1).join('/supacharger/'), mocks);
      }
      return require(name === 'next/server' ? 'next/server.js' : name);
    }, module, module.exports,
  );
  return module.exports;
}

const route = 'src/app/(supacharger)/(unauthenticated)/auth/confirm/route.ts';
function handler({ verifyError = null, claims = { amr: [{ method: 'recovery' }] }, claimsError = null } = {}) {
  const calls = [];
  const supabase = { auth: {
    verifyOtp: async (input) => { calls.push(['verify', input]); return { error: verifyError }; },
    getClaims: async () => { calls.push(['claims']); return { data: { claims }, error: claimsError }; },
    getUser: async () => { calls.push(['user']); return { data: { user: { email_confirmed_at: 'today' } } }; },
  } };
  const { GET } = load(route, {
    '@/lib/supabase/server': { createClient: async () => supabase },
    '@/supacharger/utils/request-url': { getAppRequestOrigin: (request) => new URL(request.url).origin },
    '@/supacharger/supacharger-config': { SC_CONFIG: {
      ACCOUNT_CONFIRMED_PATH: '/account/confirmed',
      USER_REDIRECTS: { UNAUTHED_USER: { AUTHGUARD_REDIRECT_DESTINATION: '/account/login' } },
    } },
  });
  return { GET, calls };
}

test('recovery verifies a token hash without browser cookies and strips all tokens from the destination', async () => {
  const { GET, calls } = handler();
  const result = await GET(new NextRequest('https://app.example/auth/confirm?token_hash=test-token&type=recovery&next=https://evil.example'));
  assert.equal(result.headers.get('location'), 'https://app.example/account/reset-password/new');
  assert.equal(result.headers.get('cache-control'), 'private, no-store');
  assert.equal(result.headers.get('referrer-policy'), 'no-referrer');
  assert.deepEqual(calls, [['verify', { token_hash: 'test-token', type: 'recovery' }], ['claims']]);
});

for (const reason of ['expired', 'used', 'invalid']) {
  test(`${reason} recovery token fails even when already signed in`, async () => {
    const { GET, calls } = handler({ verifyError: { message: reason } });
    const result = await GET(new NextRequest('https://app.example/auth/confirm?token_hash=test-token&type=recovery'));
    assert.equal(result.headers.get('location'), 'https://app.example/auth/error?flow=recovery');
    assert.equal(calls.some(([name]) => name === 'user'), false);
  });
}

for (const options of [{ claims: { amr: [{ method: 'password' }] } }, { claimsError: { message: 'unverified' } }]) {
  test('a recovery token needs independently verified recovery claims', async () => {
    const { GET } = handler(options);
    const result = await GET(new NextRequest('https://app.example/auth/confirm?token_hash=test-token&type=recovery'));
    assert.equal(result.headers.get('location'), 'https://app.example/auth/error?flow=recovery');
  });
}

test('missing recovery token does not call Auth or accept another session', async () => {
  const { GET, calls } = handler();
  const result = await GET(new NextRequest('https://app.example/auth/confirm?type=recovery'));
  assert.equal(result.headers.get('location'), 'https://app.example/auth/error?flow=recovery');
  assert.deepEqual(calls, []);
});

test('signup verification preserves safe next routing and rejects external redirects', async () => {
  for (const [next, expected] of [['/account/setup-profile', '/account/setup-profile'], ['//evil.example', '/account/confirmed']]) {
    const { GET } = handler();
    const result = await GET(new NextRequest(`https://app.example/auth/confirm?token_hash=test-token&type=email&next=${encodeURIComponent(next)}`));
    assert.equal(result.headers.get('location'), `https://app.example${expected}`);
  }
});

test('unknown OTP types never reach verifyOtp', async () => {
  const { GET, calls } = handler();
  await GET(new NextRequest('https://app.example/auth/confirm?token_hash=test-token&type=admin'));
  assert.equal(calls.some(([name]) => name === 'verify'), false);
});

test('Proxy propagates SDK cookie rotation and headers to downstream requests and redirects', async () => {
  const { copySupabaseResponseState } = load('src/supacharger/auth/proxy-response.ts');
  const { NextResponse } = require('next/server.js');
  let config;
  const { updateSession } = load('src/lib/supabase/supacharger/proxy.ts', {
    '@supabase/ssr': { createServerClient: (_url, _key, options) => {
      config = options;
      return { auth: { getClaims: async () => {
        options.cookies.setAll([{ name: 'sb-test-auth-token', value: 'rotated', options: { path: '/', httpOnly: true } }], {
          'Cache-Control': 'private, no-store', Expires: '0', Pragma: 'no-cache',
        });
        return { data: { claims: { sub: 'test-user', role: 'authenticated' } }, error: null };
      } } };
    } },
    '@/supacharger/supacharger-config': { SC_CONFIG: { AUTH_SESSION: { ALLOW_ANONYMOUS_USERS: false } } },
    '@/supacharger/utils/helpers': { getEnvVar: () => 'https://example.supabase.co' },
  });
  const request = new NextRequest('https://app.example/account');
  const result = await updateSession(request);
  assert.equal(config.global, undefined, 'No custom token transport');
  assert.equal(result.isAuthenticated, true);
  assert.equal(request.cookies.get('sb-test-auth-token').value, 'rotated');
  const redirect = copySupabaseResponseState(result.response, NextResponse.redirect('https://app.example/next'));
  assert.equal(redirect.cookies.get('sb-test-auth-token').value, 'rotated');
  assert.equal(redirect.headers.get('cache-control'), 'private, no-store');
  assert.equal(redirect.headers.get('expires'), '0');
  assert.equal(redirect.headers.get('pragma'), 'no-cache');
});

const { resolveAppOrigin, appURL, parseAppOrigin } = load('src/supacharger/utils/app-origin.ts');
const allowed = ['https://primary.example', 'https://alias.example', 'http://localhost:3400'];

test('request URLs preserve each approved domain instead of the canonical host', () => {
  for (const origin of allowed) {
    const headers = new Headers({ host: new URL(origin).host, origin });
    assert.equal(resolveAppOrigin(headers, allowed, `${origin}/account`), origin);
    assert.equal(resolveAppOrigin(headers, allowed), origin);
    assert.equal(appURL('/auth/callback', origin), `${origin}/auth/callback`);
  }
});

test('unapproved and spoofed origins cannot receive sensitive links', () => {
  for (const headers of [
    { host: 'evil.example', origin: 'https://evil.example' },
    { host: 'alias.example', origin: 'https://evil.example' },
    { host: 'evil.example', origin: 'https://alias.example' },
    { host: 'alias.example', 'x-forwarded-host': 'evil.example' },
    { host: 'alias.example,evil.example' },
    { host: 'alias.example', 'x-forwarded-proto': 'javascript' },
    { host: 'alias.example', origin: 'null' },
  ]) assert.throws(() => resolveAppOrigin(new Headers(headers), allowed));
  assert.throws(() => resolveAppOrigin(new Headers({ host: 'alias.example' }), allowed, 'https://evil.example/auth/callback'));
});

test('safe proxy origins and requests without Origin preserve their allowed host', () => {
  assert.equal(resolveAppOrigin(new Headers({ host: 'alias.example' }), allowed), 'https://alias.example');
  assert.equal(resolveAppOrigin(new Headers({ host: 'internal:3000', 'x-forwarded-host': 'alias.example', 'x-forwarded-proto': 'https' }), allowed), 'https://alias.example');
  assert.equal(resolveAppOrigin(new Headers({ host: 'localhost:3400' }), allowed), 'http://localhost:3400');
});

test('origin and path validation rejects credentials, paths and redirect escapes', () => {
  for (const origin of ['https://user:pass@alias.example', 'https://alias.example/path', 'https://alias.example?x=1', 'javascript:alert(1)']) {
    assert.throws(() => parseAppOrigin(origin));
  }
  for (const path of ['https://evil.example', '//evil.example', '/%2f/evil.example', '/\\evil.example']) {
    assert.throws(() => appURL(path, 'https://alias.example'));
  }
  assert.equal(appURL('/account?next=%2Fprojects', 'https://alias.example'), 'https://alias.example/account?next=%2Fprojects');
});

test('recovery email uses the complete per-request confirmation URL exactly once', () => {
  const template = readFileSync(new URL('../docs/agents/authentication-and-claims.md', import.meta.url), 'utf8');
  const destination = appURL('/auth/confirm', 'https://alias.example');
  const rendered = template.replaceAll('{{ .RedirectTo }}', destination).replaceAll('{{ .TokenHash }}', 'test-hash').replaceAll('&amp;', '&');
  const url = new URL(rendered.match(/href="([^"]+)"/)[1]);
  assert.equal(url.origin, 'https://alias.example');
  assert.equal(url.pathname, '/auth/confirm');
  assert.equal(url.searchParams.get('type'), 'recovery');
  assert.equal(url.searchParams.get('token_hash'), 'test-hash');
  assert.equal(url.searchParams.has('next'), false);
});

test('recovery action sends the per-request redirect and validates email before Auth', async () => {
  const calls = [];
  const { sendPasswordReset } = load('src/lib/supabase/supacharger/supabase-auth.ts', {
    'next/navigation': { redirect: () => { throw new Error('Unexpected redirect'); } },
    '../server': { createClient: async () => ({ auth: {
      resetPasswordForEmail: async (...args) => { calls.push(args); return { error: null }; },
    } }) },
    '@/supacharger/utils/request-url': { getRequestURL: async (path) => appURL(path, 'https://alias.example') },
    '@/supacharger/utils/helpers': { isValidEmail: () => true, evaluatePasswordStrength: () => ({ valid: true }) },
    '@/supacharger/supacharger-config': { SC_CONFIG: {} },
  });
  await sendPasswordReset('not-an-email');
  assert.deepEqual(calls, []);
  await sendPasswordReset(' test@example.com ');
  assert.deepEqual(calls, [['test@example.com', {
    redirectTo: 'https://alias.example/auth/confirm',
  }]]);
});

test('callback adapter keeps onboarding and success on the callback domain', async () => {
  const { resolveAuthCallbackFailure, resolveAuthCallbackSuccess } = load('src/supacharger.adapters/auth-callback.ts', {
    'server-only': {},
    '@/supacharger/supacharger-config': { SC_CONFIG: {
      POST_SIGN_IN_ONBOARDING: { REQUIRED: true, REDIRECT_PATH: '/account/setup-profile' },
      PROFILE_IDENTITY: { USERNAME: 'disabled' }, BILLING_ACCESS: { REQUIRED: false },
      AUTHENTICATION: { MFA_TOTP: { REQUIRED_FOR_SIGN_IN: false } },
      USER_REDIRECTS: { AUTHED_USER: { LOGIN_REDIRECT_DESTINATION: '/account' } },
    } },
  });
  let complete = false;
  const context = { nextPath: '/projects', requestUrl: new URL('https://alias.example/auth/callback'),
    supabase: { schema: () => ({ rpc: async () => ({ data: complete, error: null }) }) } };
  assert.equal(await resolveAuthCallbackSuccess(context), 'https://alias.example/account/setup-profile?next=%2Fprojects');
  complete = true;
  assert.equal(await resolveAuthCallbackSuccess(context), 'https://alias.example/projects');
  assert.equal(await resolveAuthCallbackFailure(context), 'https://alias.example/auth/error');
});
