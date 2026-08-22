import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { copySupabaseResponseState } from '../src/supacharger/auth/proxy-response.ts';
import { pathMatches, shouldCheckPostSignInOnboarding } from '../src/supacharger/auth/route-policy.ts';
import { getSafeNextPath, withNextPath } from '../src/supacharger/auth/safe-next-path.js';

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

test('public marketing routes bypass post-sign-in onboarding protection', () => {
  const publicPaths = [
    '/',
    '/about',
    '/pricing',
    '/legal',
    '/license',
    '/whats-included',
    '/paywall-demos',
    '/profile/:username',
  ];
  const policy = (pathname) =>
    shouldCheckPostSignInOnboarding({
      isAuthenticated: true,
      isPublicPath: pathMatches(pathname, publicPaths),
      pathname,
      redirectPath: '/account/setup-profile',
      required: true,
    });

  assert.equal(policy('/'), false);
  assert.equal(policy('/about'), false);
  assert.equal(policy('/pricing'), false);
  assert.equal(policy('/legal'), false);
  assert.equal(policy('/license'), false);
  assert.equal(policy('/whats-included'), false);
  assert.equal(policy('/paywall-demos'), false);
  assert.equal(policy('/profile/fern-friends'), false);
  assert.equal(policy('/account'), true);
  assert.equal(policy('/account/setup-profile'), false);
});

test('crawler metadata endpoints bypass Proxy authentication and redirects', async () => {
  const proxy = await readFile(new URL('../src/proxy.ts', import.meta.url), 'utf8');

  assert.ok(proxy.includes('robots\\\\.txt'));
  assert.ok(proxy.includes('sitemap\\\\.xml'));
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
  assert.equal(getSafeNextPath('https://attacker.example/invite'), null);
  assert.equal(getSafeNextPath('//attacker.example/invite'), null);
  assert.equal(getSafeNextPath('/%2f%2fattacker.example/invite'), null);
  assert.equal(getSafeNextPath('/\\attacker.example/invite'), null);
});
