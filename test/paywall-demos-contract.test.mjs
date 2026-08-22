import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('public paywall gallery demonstrates seven billing entry patterns', async () => {
  const [gallery, page, englishMessages] = await Promise.all([
    read('src/components/sc_demo/sc_paywall-demos.tsx'),
    read('src/app/(project)/(unauthenticated)/(sc_demo)/paywall-demos/page.tsx'),
    read('messages/en.json'),
  ]);
  const messages = JSON.parse(englishMessages).MarketingFeaturePages.paywallDemos;

  assert.match(page, /<SCPaywallDemos \/>/);
  for (const pattern of [
    /<Dialog/,
    /const openUpgradeModal = \(\) => setUpgradeModalOpen\(true\)/,
    /<SCCopyCodeButton/,
    /href='\/pricing'/,
    /<Tooltip/,
    /setSelectedServices/,
    /<Sheet/,
    /setInAppPurchaseReady/,
    /stripeEmbeddedCheckout/,
  ]) {
    assert.match(gallery, pattern);
  }

  assert.equal(messages.items.length, 7);
  assert.equal(messages.eyebrow, undefined);
  assert.doesNotMatch(gallery, /content\.eyebrow/);
  assert.match(messages.modalExample.code, /onClick=\{openUpgradeModal\}/);
  assert.match(messages.modalExample.agentNote, /Supacharger MCP/);
  assert.match(messages.modalExample.agentNote, /installed skills/);
  assert.equal(messages.billingCta.href, '/account/create?next=%2Faccount%2Fbilling%2Fsubscribe%3Ffull%3D1');
});
