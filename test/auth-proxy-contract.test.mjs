import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

import { decideAccess } from '../src/supacharger/auth/access-decision.ts';
import { copySupabaseResponseState } from '../src/supacharger/auth/proxy-response.ts';
import { pathMatches } from '../src/supacharger/auth/route-policy.ts';
import { getSafeNextPath, withNextPath } from '../src/supacharger/auth/safe-next-path.js';
import { hasSensitiveAuthQuery, removeSensitiveAuthQuery } from '../src/supacharger/auth/sensitive-auth-query.ts';

const appDirectory = new URL('../src/app/', import.meta.url);

async function findRoutePage(publicPath) {
  const expectedSegments = publicPath.split('?')[0].split('/').filter(Boolean);
  const pages = [];

  async function walk(directory) {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const entryPath = path.join(directory, entry.name);
      if (entry.isDirectory()) await walk(entryPath);
      else if (/^page\.(?:js|jsx|ts|tsx)$/.test(entry.name)) pages.push(entryPath);
    }
  }

  await walk(appDirectory.pathname);

  return (
    pages.find((pagePath) => {
      const relativeDirectory = path.relative(appDirectory.pathname, path.dirname(pagePath));
      const routeSegments = relativeDirectory
        .split(path.sep)
        .filter((segment) => segment && !(segment.startsWith('(') && segment.endsWith(')')));
      return (
        routeSegments.length === expectedSegments.length &&
        routeSegments.every((segment, index) => segment === expectedSegments[index])
      );
    }) ?? null
  );
}

async function readAncestorLayouts(pagePath) {
  const sources = [];
  let directory = path.dirname(pagePath);

  while (directory.startsWith(appDirectory.pathname)) {
    for (const extension of ['tsx', 'ts', 'jsx', 'js']) {
      try {
        sources.push(await readFile(path.join(directory, `layout.${extension}`), 'utf8'));
      } catch (error) {
        if (error?.code !== 'ENOENT') throw error;
      }
    }
    if (directory === appDirectory.pathname.replace(/\/$/, '')) break;
    directory = path.dirname(directory);
  }

  return sources.join('\n');
}

function responseDouble(cookies = [], headers = {}) {
  const writtenCookies = [];

  return {
    cookies: {
      getAll: () => cookies,
      set: (...args) => writtenCookies.push(args),
    },
    headers: new Headers(headers),
    writtenCookies,
  };
}

test('route policy matches literal, parameter and trailing wildcard segments', () => {
  assert.equal(pathMatches('/account', ['/account']), true);
  assert.equal(pathMatches('/accounts', ['/account']), false);
  assert.equal(pathMatches('/organisations/acme', ['/organisations/:handle']), true);
  assert.equal(pathMatches('/organisations/acme/settings', ['/organisations/:handle']), false);
  assert.equal(pathMatches('/docs', ['/docs/:path*']), true);
  assert.equal(pathMatches('/docs/auth/roles', ['/docs/:path*']), true);
});

test('route policy rejects malformed patterns', () => {
  assert.throws(() => pathMatches('/account', ['account']), /must start with/);
});

test('Proxy performs claims verification without profile or billing RPCs', async () => {
  const [proxy, sessionAdapter] = await Promise.all([
    readFile(new URL('../src/proxy.ts', import.meta.url), 'utf8'),
    readFile(new URL('../src/lib/supabase/supacharger/proxy.ts', import.meta.url), 'utf8'),
  ]);

  assert.match(sessionAdapter, /auth\.getClaims\(\)/);
  assert.doesNotMatch(sessionAdapter, /auth\.getUser\(\)/);
  assert.doesNotMatch(proxy, /\.rpc\(/);
  assert.doesNotMatch(proxy, /get_account_profile_by_current_user/);
  assert.doesNotMatch(proxy, /is_profile_complete_by_current_user/);
  assert.doesNotMatch(proxy, /has_billing_access_by_current_user/);
});

test('browser, server, and Proxy clients keep compact session cookies aligned', async () => {
  const [browserClient, serverClient, proxyClient] = await Promise.all([
    readFile(new URL('../src/lib/supabase/client.ts', import.meta.url), 'utf8'),
    readFile(new URL('../src/lib/supabase/server.ts', import.meta.url), 'utf8'),
    readFile(new URL('../src/lib/supabase/supacharger/proxy.ts', import.meta.url), 'utf8'),
  ]);

  for (const source of [browserClient, serverClient, proxyClient]) {
    assert.match(source, /cookies:\s*\{[\s\S]*?encode:\s*'tokens-only'/);
  }

  assert.doesNotMatch(`${serverClient}\n${proxyClient}`, /getSession\(\)\.user/);
});

test('protected layout enforces profile and billing access on the server', async () => {
  const [layout, access] = await Promise.all([
    readFile(new URL('../src/app/(project)/(authenticated)/layout.tsx', import.meta.url), 'utf8'),
    readFile(new URL('../src/supacharger/auth/server-access.ts', import.meta.url), 'utf8'),
  ]);

  assert.match(layout, /await requireAppAccess\(\)/);
  assert.match(access, /requireOnboardedUser/);
  assert.match(access, /is_profile_complete_by_current_user/);
  assert.match(access, /has_billing_access_by_current_user/);
});

test('access decisions preserve verified, onboarded, and full-app boundaries', () => {
  const defaults = {
    billingRequired: true,
    hasBillingAccess: false,
    isProfileComplete: false,
    isVerified: true,
    onboardingRequired: true,
  };

  assert.equal(decideAccess({ ...defaults, boundary: 'verified' }), 'allow');
  assert.equal(decideAccess({ ...defaults, boundary: 'onboarded' }), 'onboarding');
  assert.equal(decideAccess({ ...defaults, boundary: 'app' }), 'onboarding');
  assert.equal(decideAccess({ ...defaults, boundary: 'onboarded', isProfileComplete: true }), 'allow');
  assert.equal(decideAccess({ ...defaults, boundary: 'app', isProfileComplete: true }), 'billing');
  assert.equal(
    decideAccess({ ...defaults, boundary: 'app', hasBillingAccess: true, isProfileComplete: true }),
    'allow',
  );
  assert.equal(decideAccess({ ...defaults, boundary: 'verified', isVerified: false }), 'login');
  assert.equal(
    decideAccess({ ...defaults, boundary: 'app', isProfileComplete: false, onboardingRequired: false }),
    'billing',
  );
  assert.equal(
    decideAccess({
      ...defaults,
      billingRequired: false,
      boundary: 'app',
      isProfileComplete: true,
    }),
    'allow',
  );
});

test('canonical recovery routes do not inherit the requirement they recover', async () => {
  const setupPage = await findRoutePage('/account/setup-profile');
  if (setupPage) {
    const setupLayouts = await readAncestorLayouts(setupPage);
    const setupBoundary = `${await readFile(setupPage, 'utf8')}\n${setupLayouts}`;
    assert.doesNotMatch(setupBoundary, /requireOnboardedUser|requireAppAccess/);
    assert.match(setupBoundary, /requireVerifiedUser/);
  }

  const billingPage = await findRoutePage('/account/billing/subscribe');
  if (billingPage) {
    const billingLayouts = await readAncestorLayouts(billingPage);
    const billingBoundary = `${await readFile(billingPage, 'utf8')}\n${billingLayouts}`;
    assert.doesNotMatch(billingBoundary, /requireAppAccess/);
    assert.match(billingBoundary, /requireOnboardedUser/);
  }
});

test('a full-app denial terminates at the matching recovery boundary', () => {
  const incomplete = {
    billingRequired: true,
    hasBillingAccess: false,
    isProfileComplete: false,
    isVerified: true,
    onboardingRequired: true,
  };
  const unpaid = { ...incomplete, isProfileComplete: true };

  assert.equal(decideAccess({ ...incomplete, boundary: 'app' }), 'onboarding');
  assert.equal(decideAccess({ ...incomplete, boundary: 'verified' }), 'allow');
  assert.equal(decideAccess({ ...unpaid, boundary: 'app' }), 'billing');
  assert.equal(decideAccess({ ...unpaid, boundary: 'onboarded' }), 'allow');
});

test('server and callback access checks surface RPC errors and preserve onboarding order', async () => {
  const [access, callback] = await Promise.all([
    readFile(new URL('../src/supacharger/auth/server-access.ts', import.meta.url), 'utf8'),
    readFile(new URL('../src/supacharger.adapters/auth-callback.ts', import.meta.url), 'utf8'),
  ]);

  assert.match(access, /if \(profileResult\.error\) throw profileResult\.error/);
  assert.match(access, /if \(billingResult\.error\) throw billingResult\.error/);
  assert.ok(
    callback.indexOf('is_profile_complete_by_current_user') < callback.indexOf('has_billing_access_by_current_user'),
  );
  assert.match(callback, /if \(profileError\) throw profileError/);
  assert.match(callback, /if \(billingError\) throw billingError/);
});

test('framework, crawler and application metadata endpoints bypass Proxy authentication and redirects', async () => {
  const proxy = await readFile(new URL('../src/proxy.ts', import.meta.url), 'utf8');

  assert.ok(proxy.includes('_next(?:/.*)?'));
  assert.ok(proxy.includes('robots\\\\.txt'));
  assert.ok(proxy.includes('sitemap\\\\.xml'));
  assert.ok(proxy.includes('webmanifest'));
});

test('response-state copy preserves refreshed cookies and cache headers only', () => {
  const source = responseDouble([{ name: 'sb-session', value: 'refreshed', httpOnly: true }], {
    'cache-control': 'private, no-store',
    expires: '0',
    pragma: 'no-cache',
    'x-internal': 'skip',
  });
  const target = responseDouble();

  assert.equal(copySupabaseResponseState(source, target), target);
  assert.deepEqual(target.writtenCookies, [['sb-session', 'refreshed', { httpOnly: true }]]);
  assert.equal(target.headers.get('cache-control'), 'private, no-store');
  assert.equal(target.headers.get('expires'), '0');
  assert.equal(target.headers.get('pragma'), 'no-cache');
  assert.equal(target.headers.has('x-internal'), false);
});

test('auth return paths accept internal URLs and reject external redirects', () => {
  const returnPath = '/events?filter=mine';
  assert.equal(getSafeNextPath(returnPath), returnPath);
  assert.equal(withNextPath('/account/login', returnPath), `/account/login?next=${encodeURIComponent(returnPath)}`);
  assert.equal(withNextPath('/account/login', '/'), '/account/login');
  assert.equal(withNextPath('/account/login', '/?notice=1'), '/account/login?next=%2F%3Fnotice%3D1');
  assert.equal(getSafeNextPath('https://attacker.example/invite'), null);
  assert.equal(getSafeNextPath('//attacker.example/invite'), null);
  assert.equal(getSafeNextPath('/%2f%2fattacker.example/invite'), null);
  assert.equal(getSafeNextPath('/\\attacker.example/invite'), null);
});

test('sensitive authentication fields are removed without discarding safe return data', () => {
  const searchParams = new URLSearchParams({
    email: 'security-test@example.invalid',
    lang: 'en',
    password: 'not-a-real-password',
    returnTo: '/account/security?notice=security-check',
  });

  assert.equal(hasSensitiveAuthQuery('/auth/login', searchParams), true);
  assert.equal(hasSensitiveAuthQuery('/projects', searchParams), false);

  removeSensitiveAuthQuery(searchParams);

  assert.equal(searchParams.has('email'), false);
  assert.equal(searchParams.has('password'), false);
  assert.equal(searchParams.get('lang'), 'en');
  assert.equal(searchParams.get('returnTo'), '/account/security?notice=security-check');
});

// Behavioural tests use a fake Auth service; never rotate a real session.
const { createServerClient } = await import('@supabase/ssr');
const { createAuthTransport, createRefreshCoordinator } = await import('../src/lib/supabase/supacharger/refresh-transport.ts');
const { readAccessToken } = await import('../src/lib/supabase/supacharger/passive-session.ts');
const refreshUrl = 'https://test.supabase.co/auth/v1/token?grant_type=refresh_token';
const refreshOptions = (token = 'old-refresh') => ({ method: 'POST', headers: { apikey: 'test-key' }, body: JSON.stringify({ refresh_token: token }) });
const freshSession = () => Response.json({ access_token: 'new-access', refresh_token: 'new-refresh', expires_in: 3600, user: { id: 'test-user' } });

test('separate SSR clients share one refresh and independently persist the rotated cookies', async () => {
  let calls = 0;
  const coordinate = createRefreshCoordinator();
  const cookie = 'base64-' + Buffer.from(JSON.stringify({ access_token: 'old', refresh_token: 'old-refresh', expires_at: 1 })).toString('base64url');
  const writes = [];
  const clients = Array.from({ length: 20 }, () => {
    const transport = createAuthTransport('https://test.supabase.co', async () => { calls++; return freshSession(); }, coordinate);
    return createServerClient('https://test.supabase.co', 'test-key', {
      global: { fetch: transport.fetch },
      cookies: { encode: 'tokens-only', getAll: () => [{ name: 'sb-test-auth-token', value: cookie }], setAll: (cookies) => writes.push(cookies) },
    });
  });
  const results = await Promise.all(clients.map((client) => client.auth.getSession()));
  assert.equal(calls, 1);
  assert.ok(results.every((result) => result.data.session.access_token === 'new-access'));
  assert.equal(writes.length, 20);
});

test('refresh replay expires and never crosses token, key or project boundaries', async () => {
  let now = 0;
  let calls = 0;
  const coordinate = createRefreshCoordinator(() => now);
  const upstream = async () => { calls++; return freshSession(); };
  const first = createAuthTransport('https://test.supabase.co', upstream, coordinate);
  await first.fetch(refreshUrl, refreshOptions());
  await first.fetch(refreshUrl, refreshOptions());
  assert.equal(calls, 1);
  await first.fetch(refreshUrl, refreshOptions('different'));
  const otherKey = refreshOptions(); otherKey.headers.apikey = 'another-key';
  await first.fetch(refreshUrl, otherKey);
  await createAuthTransport('https://other.supabase.co', upstream, coordinate).fetch(refreshUrl.replace('test.', 'other.'), refreshOptions());
  assert.equal(calls, 4);
  now = 10001;
  await first.fetch(refreshUrl, refreshOptions());
  assert.equal(calls, 5);
});

test('contention, throttling and outages share cooldown without repeated upstream retries', async () => {
  for (const status of [409, 429, 500, 504]) {
    let now = 0; let calls = 0;
    const coordinate = createRefreshCoordinator(() => now);
    const upstream = async () => { calls++; return Response.json({}, { status }); };
    for (let index = 0; index < 20; index++) {
      const transport = createAuthTransport('https://test.supabase.co', upstream, coordinate);
      const response = await transport.fetch(refreshUrl, refreshOptions());
      assert.equal(response.status, 409);
      assert.equal(transport.isTemporarilyUnavailable(), true);
    }
    assert.equal(calls, 1);
    now = 30001;
    await createAuthTransport('https://test.supabase.co', upstream, coordinate).fetch(refreshUrl, refreshOptions());
    assert.equal(calls, 2);
  }
});

test('network outage opens a circuit for other tokens and leaves unrelated requests untouched', async () => {
  let calls = 0;
  const transport = createAuthTransport('https://test.supabase.co', async () => { calls++; throw Error('network'); }, createRefreshCoordinator());
  await transport.fetch(refreshUrl, refreshOptions());
  await transport.fetch(refreshUrl, refreshOptions('another-token'));
  assert.equal(calls, 1);
  const ordinary = createAuthTransport('https://test.supabase.co', async () => Response.json({ ok: true }));
  assert.equal((await ordinary.fetch('https://test.supabase.co/rest/v1/items')).status, 200);
  assert.equal(ordinary.isTemporarilyUnavailable(), false);
});

test('unknown tokens cannot exceed in-flight and per-minute admission bounds', async () => {
  const pending = [];
  let calls = 0;
  const transport = createAuthTransport('https://test.supabase.co', () => { calls++; return new Promise((resolve) => pending.push(resolve)); }, createRefreshCoordinator());
  const requests = Array.from({ length: 30 }, (_, index) => transport.fetch(refreshUrl, refreshOptions(String(index))));
  assert.equal(calls, 8);
  pending.forEach((resolve) => resolve(freshSession()));
  const results = await Promise.all(requests);
  assert.equal(results.filter((response) => response.status === 409).length, 22);
  let sequentialCalls = 0;
  const sequential = createAuthTransport('https://test.supabase.co', async () => { sequentialCalls++; return Response.json({}, { status: 400 }); }, createRefreshCoordinator(() => 0));
  for (let index = 0; index < 100; index++) await sequential.fetch(refreshUrl, refreshOptions(String(index)));
  assert.equal(sequentialCalls, 60);
});

test('permanent rejection stays permanent and malformed refresh requests never reach Auth', async () => {
  let calls = 0;
  const transport = createAuthTransport('https://test.supabase.co', async () => { calls++; return Response.json({ error_code: 'refresh_token_not_found' }, { status: 400 }); }, createRefreshCoordinator());
  assert.equal((await transport.fetch(refreshUrl, refreshOptions())).status, 400);
  assert.equal(transport.isTemporarilyUnavailable(), false);
  for (const body of ['bad JSON', '{}', JSON.stringify({ refresh_token: 'x'.repeat(17000) })]) {
    await transport.fetch(refreshUrl, { ...refreshOptions(), body });
  }
  assert.equal(calls, 1);
});

test('passive presentation reads only a bounded token from this project and leaves verification to getClaims', async () => {
  const value = 'base64-' + Buffer.from(JSON.stringify({ access_token: 'untrusted-token' })).toString('base64url');
  assert.equal(await readAccessToken('https://test.supabase.co', [{ name: 'sb-test-auth-token.0', value: value.slice(0, 12) }, { name: 'sb-test-auth-token.1', value: value.slice(12) }]), 'untrusted-token');
  assert.equal(await readAccessToken('https://other.supabase.co', [{ name: 'sb-test-auth-token', value }]), null);
  for (const invalid of ['broken', 'base64-??', 'x'.repeat(32769), '{"access_token":123}']) {
    assert.equal(await readAccessToken('https://test.supabase.co', [{ name: 'sb-test-auth-token', value: invalid }]), null);
  }
  const source = await readFile(new URL('../src/lib/supabase/supacharger/supabase-auth.ts', import.meta.url), 'utf8');
  const presentation = source.slice(source.indexOf('export async function isLoggedIn()'), source.indexOf('export async function verifyOtp'));
  assert.match(presentation, /getClaims\(token\)/);
  assert.doesNotMatch(presentation, /getUser\(|getSession\(/);
});

test('Proxy stops transient refresh failures before routing and preserves cookies', async () => {
  const proxy = await readFile(new URL('../src/proxy.ts', import.meta.url), 'utf8');
  const adapter = await readFile(new URL('../src/lib/supabase/supacharger/proxy.ts', import.meta.url), 'utf8');
  const server = await readFile(new URL('../src/lib/supabase/server.ts', import.meta.url), 'utf8');
  assert.match(proxy, /status: 503/);
  assert.match(proxy, /'Retry-After': '30'/);
  assert.ok(proxy.indexOf('if (temporarilyUnavailable)') < proxy.indexOf('if (!isAuthenticated)'));
  for (const source of [adapter, server]) assert.match(source, /if \(transport.isTemporarilyUnavailable\(\)\) return/);
  assert.match(server, /cache\(async function createClient/);
});

test('temporary refresh failures do not write logout cookies through the SSR adapter', async () => {
  for (const status of [409, 429, 504]) {
    const transport = createAuthTransport('https://test.supabase.co', async () => Response.json({}, { status }), createRefreshCoordinator());
    const value = 'base64-' + Buffer.from(JSON.stringify({ access_token: 'old', refresh_token: 'old-refresh', expires_at: 1 })).toString('base64url');
    let writes = 0;
    const client = createServerClient('https://test.supabase.co', 'key', {
      global: { fetch: transport.fetch },
      cookies: { encode: 'tokens-only', getAll: () => [{ name: 'sb-test-auth-token', value }], setAll: () => {
        if (transport.isTemporarilyUnavailable()) return;
        writes++;
      } },
    });
    const result = await client.auth.getSession();
    assert.equal(result.error.status, 409);
    assert.equal(result.error.code, 'refresh_temporarily_unavailable');
    assert.equal(writes, 0);
  }
});


test('project guard runs after authentication routing, reuses its client and preserves response state', async () => {
  const { createRequire } = await import('node:module');
  const require = createRequire(import.meta.url);
  const { runInNewContext } = await import('node:vm');
  const ts = require('typescript');
  const { NextRequest, NextResponse } = require('next/server');
  const code = ts.transpileModule(await readFile(new URL('../src/proxy.ts', import.meta.url), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const client = {};
  let calls = 0;
  let thrown = false;
  let authenticated = false;
  const response = NextResponse.next();
  response.cookies.set('session-test', 'rotated', { httpOnly: true });
  response.headers.set('Cache-Control', 'private, no-store');
  const modules = {
    './i18n/config': { isSupportedLocale: () => false, LOCALE_COOKIE_NAME: 'locale' },
    './lib/supabase/supacharger/proxy': { updateSession: async () => ({ isAuthenticated: authenticated, response, supabase: client, getResponse: () => response }) },
    './supacharger/auth/proxy-response': { copySupabaseResponseState },
    './supacharger/auth/route-policy': { pathMatches },
    './supacharger/auth/safe-next-path': { withNextPath },
    './supacharger/auth/sensitive-auth-query': { hasSensitiveAuthQuery, removeSensitiveAuthQuery },
    './supacharger/supacharger-config': { SC_CONFIG: { AUTH_ONLY_APP: true, PATH_AUTH_GUARD: { UNAUTHED_USER: { ALLOWED: ['/public/:id'], DISALLOWED: [] }, AUTHED_USER: { DISALLOWED: [] } }, USER_REDIRECTS: { UNAUTHED_USER: { AUTHGUARD_REDIRECT_DESTINATION: '/account/login' } } } },
    './supacharger.adapters/request-guard': { resolveProjectRequest: async context => {
      calls++; assert.equal(context.supabase, client); assert.equal(context.isAuthenticated, authenticated);
      if (thrown) throw new Error('private upstream details');
      return new NextResponse(null, { status: 404 });
    } },
  };
  const exports = {};
  runInNewContext(code, { exports, process, require: name => name === 'next/server' ? require(name) : modules[name], URL });
  const denied = await exports.proxy(new NextRequest('https://example.com/api/private'));
  assert.equal(denied.status, 401); assert.equal(calls, 0);
  const redirected = await exports.proxy(new NextRequest('https://example.com/private'));
  assert.equal(redirected.status, 307); assert.equal(calls, 0);
  for (const identity of [false, true]) {
    authenticated = identity;
    const missing = await exports.proxy(new NextRequest('https://example.com/public/missing'));
    assert.equal(missing.status, 404);
    assert.equal(missing.cookies.get('session-test').value, 'rotated');
    assert.equal(missing.headers.get('cache-control'), 'private, no-store');
  }
  thrown = true;
  const outage = await exports.proxy(new NextRequest('https://example.com/public/missing'));
  assert.equal(outage.status, 503); assert.equal(await outage.text(), '');
  assert.equal(outage.cookies.get('session-test').value, 'rotated');
});
