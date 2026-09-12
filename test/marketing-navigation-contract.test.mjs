import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('the marketing header groups anchors and exposes feature and external links', async () => {
  const [header, englishMessages] = await Promise.all([
    read('src/components/sc_demo/sc_header-marketing.tsx'),
    read('messages/en.json'),
  ]);
  const messages = JSON.parse(englishMessages).MarketingNavigation;

  assert.equal(messages.licenseInformationDescription, 'Review licensing and attribution.');

  for (const anchor of ['overview', 'features', 'integrations', 'benefits', 'reviews', 'pricing']) {
    assert.match(header, new RegExp(`href: '/#${anchor}'`));
  }

  assert.match(header, /useTranslations\('MarketingNavigation'\)/);
  assert.match(header, /<NavigationMenuContent className='w-\[15rem\][^']*'>\s*<ul className='grid gap-1'>/);
  assert.doesNotMatch(header, /<ul className='grid grid-cols-2 gap-1'>/);
  assert.match(header, /href='\/features\/whats-included'/);
  assert.match(header, /href='\/features\/paywall-demos'/);
  assert.match(header, /href='\/features\/core-widget-demos'/);
  assert.match(header, /href='\/features\/whats-included'[\s\S]*?<ListChecks aria-hidden='true'/);
  assert.match(header, /href='\/features\/paywall-demos'[\s\S]*?<BadgeDollarSign aria-hidden='true'/);
  assert.match(header, /href='\/license'/);
  assert.match(header, /<Scale aria-hidden='true'/);
  assert.match(header, /href='https:\/\/supacharger\.dev'/);
  assert.match(header, /target='_blank'/);
  assert.match(header, /rel='noopener noreferrer'/);

  for (const key of [
    'inPageAnchors',
    'supachargerFeatures',
    'whatsIncluded',
    'paywallDemos',
    'coreWidgetDemos',
    'licenseInformation',
    'license',
    'supacharger',
  ]) {
    assert.equal(typeof messages[key], 'string');
    assert.ok(messages[key].length > 0);
  }
});

test('the hero and internal feature navigation resolve to public marketing pages', async () => {
  const [header, landing, config] = await Promise.all([
    read('src/components/sc_demo/sc_header-marketing.tsx'),
    read('src/components/sc_demo/sc_marketing-landing.tsx'),
    read('src/supacharger.config.ts'),
  ]);

  const publicFeatureRoutes = ['/features/whats-included', '/features/paywall-demos', '/features/core-widget-demos', '/license'];

  assert.match(landing, /<Link href='\/features\/whats-included'>\s*\{t\('exploreFeatures'\)\}/);
  for (const route of publicFeatureRoutes) {
    assert.match(header, new RegExp(`href='${route}'`));
  }
  assert.match(config, /["']\/features\/:path\*["']/);
  assert.match(config, /["']\/license["']/);
});

test('localised feature cards use stable non-translated keys', async () => {
  const landing = await read('src/components/sc_demo/sc_marketing-landing.tsx');

  assert.match(landing, /const platformFeatures = \[[\s\S]*?id: 'discovery'/);
  assert.match(landing, /key=\{feature\.id\}/);
  assert.doesNotMatch(landing, /key=\{feature\.title\}/);
});
