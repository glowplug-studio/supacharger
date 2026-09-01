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
    returnTo: '/auth/oauth/consent?authorization_id=security-check',
  });

  assert.equal(hasSensitiveAuthQuery('/auth/login', searchParams), true);
  assert.equal(hasSensitiveAuthQuery('/projects', searchParams), false);

  removeSensitiveAuthQuery(searchParams);

  assert.equal(searchParams.has('email'), false);
  assert.equal(searchParams.has('password'), false);
  assert.equal(searchParams.get('lang'), 'en');
  assert.equal(searchParams.get('returnTo'), '/auth/oauth/consent?authorization_id=security-check');
});
