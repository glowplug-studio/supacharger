import assert from 'node:assert/strict';
import test from 'node:test';

import { copySupabaseResponseState } from '../src/supacharger/auth/proxy-response.ts';
import { pathMatches } from '../src/supacharger/auth/route-policy.ts';

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

test('response-state copy preserves refreshed cookies and cache headers only', () => {
  const source = responseDouble(
    [{ name: 'sb-session', value: 'refreshed', httpOnly: true }],
    { 'cache-control': 'private, no-store', expires: '0', pragma: 'no-cache', 'x-internal': 'skip' },
  );
  const target = responseDouble();

  assert.equal(copySupabaseResponseState(source, target), target);
  assert.deepEqual(target.writtenCookies, [['sb-session', 'refreshed', { httpOnly: true }]]);
  assert.equal(target.headers.get('cache-control'), 'private, no-store');
  assert.equal(target.headers.get('expires'), '0');
  assert.equal(target.headers.get('pragma'), 'no-cache');
  assert.equal(target.headers.has('x-internal'), false);
});
