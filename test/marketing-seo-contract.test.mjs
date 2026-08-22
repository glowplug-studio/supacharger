import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

const marketingPages = {
  home: 'src/app/page.tsx',
  legal: 'src/app/(project)/(unauthenticated)/(sc_demo)/legal/page.tsx',
  license: 'src/app/(project)/(unauthenticated)/(sc_demo)/license/page.tsx',
  paywallDemos: 'src/app/(project)/(unauthenticated)/(sc_demo)/paywall-demos/page.tsx',
  pricing: 'src/app/(project)/(unauthenticated)/(sc_demo)/pricing/page.tsx',
  whatsIncluded: 'src/app/(project)/(unauthenticated)/(sc_demo)/whats-included/page.tsx',
};

test('marketing pages publish distinct canonical and social metadata', async () => {
  const [helper, layout, englishMessages, ...pages] = await Promise.all([
    read('src/components/sc_demo/sc_marketing_metadata.ts'),
    read('src/app/(project)/(unauthenticated)/(sc_demo)/layout.tsx'),
    read('messages/en.json'),
    ...Object.values(marketingPages).map(read),
  ]);
  const messages = JSON.parse(englishMessages).MarketingMetadata;

  assert.deepEqual(Object.keys(messages).sort(), Object.keys(marketingPages).sort());
  for (const page of Object.values(messages)) {
    assert.equal(typeof page.title, 'string');
    assert.ok(page.title.length > 0);
    assert.equal(typeof page.description, 'string');
    assert.ok(page.description.length > 0);
  }

  assert.match(helper, /createSupachargerPageMetadata/);
  assert.match(helper, /home:\s*'\/'/);
  assert.match(helper, /legal:\s*'\/legal'/);
  assert.match(helper, /paywallDemos:\s*'\/paywall-demos'/);
  assert.match(helper, /pricing:\s*'\/pricing'/);
  assert.match(helper, /whatsIncluded:\s*'\/whats-included'/);
  assert.match(helper, /title:\s*\{ absolute: page\.title \}/);
  assert.doesNotMatch(layout, /export const metadata|REPLACE_ME/);

  Object.keys(marketingPages).forEach((pageName, index) => {
    assert.match(pages[index], new RegExp(`createMarketingPageMetadata\\('${pageName}'\\)`));
  });
});

test('crawler discovery exposes only public marketing routes', async () => {
  const [sitemap, robots] = await Promise.all([read('src/app/sitemap.ts'), read('src/app/robots.ts')]);

  for (const path of [
    'getURL()',
    "getURL('/legal')",
    "getURL('/license')",
    "getURL('/paywall-demos')",
    "getURL('/pricing')",
    "getURL('/whats-included')",
  ]) {
    assert.match(sitemap, new RegExp(path.replace(/[()/.]/g, '\\$&')));
  }

  assert.doesNotMatch(sitemap, /account\/(?:create|login)/);
  assert.doesNotMatch(sitemap, /getURL\('\/about'\)/);
  assert.match(robots, /SC_CONFIG\.METADATA\.INDEXING_ENABLED/);
  assert.match(robots, /getURL\('\/sitemap\.xml'\)/);
  assert.match(robots, /disallow:\s*'\/'/);
});

test('the retired About marketing page is absent', () => {
  assert.equal(existsSync('src/app/(project)/(unauthenticated)/(sc_demo)/about/page.tsx'), false);
  assert.equal(existsSync('src/components/sc_demo/sc_marketing-about.tsx'), false);
});
