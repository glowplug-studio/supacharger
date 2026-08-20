import assert from 'node:assert/strict';
import test from 'node:test';

import { getSiteUrl, getURL } from '../src/supacharger/utils/site-url.ts';

const originalSiteUrl = process.env.NEXT_PUBLIC_SITE_URL;

test.afterEach(() => {
  if (originalSiteUrl === undefined) delete process.env.NEXT_PUBLIC_SITE_URL;
  else process.env.NEXT_PUBLIC_SITE_URL = originalSiteUrl;
});

test('site URLs come exclusively from NEXT_PUBLIC_SITE_URL', () => {
  process.env.NEXT_PUBLIC_SITE_URL = 'http://localhost:9876/';

  assert.equal(getSiteUrl(), 'http://localhost:9876');
  assert.equal(getURL('/auth/confirm'), 'http://localhost:9876/auth/confirm');
});

test('a configured hostname receives an https protocol', () => {
  process.env.NEXT_PUBLIC_SITE_URL = 'example.com';

  assert.equal(getSiteUrl(), 'https://example.com');
});

test('a missing site URL fails instead of silently redirecting elsewhere', () => {
  delete process.env.NEXT_PUBLIC_SITE_URL;

  assert.throws(() => getSiteUrl(), /NEXT_PUBLIC_SITE_URL/);
});

test('site URLs reject unsupported protocols', () => {
  process.env.NEXT_PUBLIC_SITE_URL = 'ftp://example.com';

  assert.throws(() => getSiteUrl(), /must use http or https/);
});
