import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('the whats-included page links to the full feature set and renders live package.json', async () => {
  const [featurePage, copyButton, messagesSource, packageSource] = await Promise.all([
    read('src/components/sc_demo/sc_marketing-feature-pages.tsx'),
    read('src/components/sc_demo/sc_copy-code-button.tsx'),
    read('messages/en.json'),
    read('package.json'),
  ]);
  const messages = JSON.parse(messagesSource).MarketingFeaturePages.whatsIncluded;
  const packageJson = JSON.parse(packageSource);

  assert.match(featurePage, /import packageJson from '\.\.\/\.\.\/\.\.\/package\.json'/);
  assert.match(featurePage, /JSON\.stringify\(packageJson, null, 2\)/);
  assert.match(featurePage, /href='https:\/\/supacharger\.dev\/product\/features'/);
  const heroEnd = featurePage.indexOf('</section>');
  const capabilitiesDescription = featurePage.indexOf('translated.capabilitiesDescription');
  const fullFeatureSetLink = featurePage.indexOf("href='https://supacharger.dev/product/features'");

  assert.ok(capabilitiesDescription > heroEnd);
  assert.ok(fullFeatureSetLink > capabilitiesDescription);
  assert.doesNotMatch(featurePage, /translated\.eyebrow/);
  assert.doesNotMatch(featurePage, /translated\.auditLabel|translated\.auditSource/);
  assert.match(featurePage, /<code>\{packageCode\}<\/code>/);
  assert.doesNotMatch(featurePage, /<main className=/);
  assert.match(copyButton, /navigator\.clipboard\.writeText\(code\)/);
  assert.match(copyButton, /CopyStatus = 'copied' \| 'error' \| 'idle'/);

  assert.equal(messages.items.length, 6);
  assert.equal(messages.eyebrow, undefined);
  assert.equal(messages.fullFeatureSet, 'View the full feature set');
  assert.equal(messages.auditLabel, undefined);
  assert.equal(messages.boundaries.length, 3);
  assert.equal(messages.stackGroups.length, 3);
  assert.equal(messages.packageFile, 'package.json');
  assert.match(packageJson.dependencies.next, /^\d+\.\d+\.\d+$/);
});
