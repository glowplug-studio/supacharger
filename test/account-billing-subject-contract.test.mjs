import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('billing subject contract distinguishes personal and organisation availability', async () => {
  const contract = await read('src/supacharger/billing/billing-contract.ts');
  assert.match(contract, /z\.discriminatedUnion\('type'/);
  assert.match(contract, /type: z\.literal\('personal'\)/);
  assert.match(contract, /organisationId: z\.uuid\(\)/);
  assert.match(contract, /config\.ORGANISATIONS\.ENABLED && config\.BILLING\.ACCOUNT_SUBJECTS\.ORGANISATION/);
  assert.match(contract, /account\.subject_id === actorUserId/);
  assert.match(contract, /account\.subject_id === subject\.organisationId/);
  for (const historicalIdentifier of [
    'billing_account_id',
    'subscription_id',
    'subscription_item_id',
    'price_id',
    'product_id',
  ]) assert.match(contract, new RegExp(historicalIdentifier));
});

test('billing service authenticates, authorises, validates prices, and keeps access gating separate', async () => {
  const service = await read('src/supacharger/billing/billing-service.ts');
  assert.match(service, /auth\.getUser\(\)/);
  assert.match(service, /userCanManageBillingAccount/);
  assert.match(service, /billingCheckoutRequestSchema\.parse/);
  assert.match(service, /price\.active/);
  assert.match(service, /price\.type !== 'recurring'/);
  assert.match(service, /billing_mode: \{ type: 'flexible' \}/);
  assert.doesNotMatch(service, /BILLING_ACCESS/);
});

test('personal routes are managed and derive the billing subject from the session', async () => {
  const [page, portal, service] = await Promise.all([
    read('src/app/(supacharger)/(authenticated)/account/billing/page.tsx'),
    read('src/app/(supacharger)/(authenticated)/account/billing/portal/route.ts'),
    read('src/supacharger/billing/billing-service.ts'),
  ]);
  assert.match(page, /PersonalBillingPage/);
  assert.match(portal, /portalRequestSchema\.safeParse/);
  assert.match(portal, /createBillingPortalUrl\(\{ type: 'personal' \}/);
  assert.doesNotMatch(portal, /billing_account_id/);
  assert.match(service, /getOrCreatePersonalBillingAccount\(actorUserId\)/);
});

test('English personal billing copy is complete', async () => {
  const messages = JSON.parse(await read('messages/en.json'));
  for (const key of [
    'title',
    'description',
    'noAccount',
    'startSubscription',
    'createAccountHelp',
    'personalAccountTitle',
    'manageBilling',
    'portalError',
    'noSubscriptions',
    'status',
    'unknownStatus',
    'features',
  ]) assert.ok(messages.AccountPages.billing[key].trim(), `Missing AccountPages.billing.${key}`);
});
