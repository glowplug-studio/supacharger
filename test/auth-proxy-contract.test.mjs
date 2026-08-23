import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { copySupabaseResponseState } from '../src/supacharger/auth/proxy-response.ts';
import { pathMatches } from '../src/supacharger/auth/route-policy.ts';
import { getSafeNextPath, withNextPath } from '../src/supacharger/auth/safe-next-path.js';
import {
  hasSensitiveAuthQuery,
  removeSensitiveAuthQuery,
} from '../src/supacharger/auth/sensitive-auth-query.ts';

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

test('protected layout enforces profile and billing access on the server', async () => {
  const [layout, access] = await Promise.all([
    readFile(new URL('../src/app/(project)/(authenticated)/layout.tsx', import.meta.url), 'utf8'),
    readFile(new URL('../src/supacharger/auth/server-access.ts', import.meta.url), 'utf8'),
  ]);

  assert.match(layout, /await requireAppAccess\(\)/);
  assert.match(access, /is_profile_complete_by_current_user/);
  assert.match(access, /has_billing_access_by_current_user/);
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
