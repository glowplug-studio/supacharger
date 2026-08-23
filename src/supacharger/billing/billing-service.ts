import { getStripeAdmin, getStripeLivemode } from '@/lib/stripe/stripe-admin';
import { createClient } from '@/lib/supabase/server';
import {
  getBillingCustomer,
  getOrCreatePersonalBillingAccount,
  putBillingCustomer,
  userCanManageBillingAccount,
} from '@/supacharger.adapters/billing/database';
import { resolveOrganisationBillingAccount } from '@/supacharger.adapters/billing/organisation';
import { SC_CONFIG } from '@/supacharger/supacharger-config';
import { getURL } from '@/supacharger/utils/helpers';

import {
  billingAccountMatchesSubject,
  billingCheckoutRequestSchema,
  billingOverviewSchema,
  type BillingSubject,
  billingSubjectIsEnabled,
  billingSubjectSchema,
} from './billing-contract';

import 'server-only';

async function authenticatedActor() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user?.id || !user.email || user.is_anonymous) {
    throw new Error('Authentication with an email address is required.');
  }
  return { email: user.email, id: user.id, supabase };
}

function assertSubjectEnabled(subject: BillingSubject) {
  if (!billingSubjectIsEnabled(SC_CONFIG, subject)) throw new Error('This billing subject is disabled.');
}

async function resolveBillingAccount(actorUserId: string, subject: BillingSubject) {
  assertSubjectEnabled(subject);
  let billingAccountId: string | null;
  if (subject.type === 'personal') {
    billingAccountId = await getOrCreatePersonalBillingAccount(actorUserId);
  } else {
    billingAccountId = await resolveOrganisationBillingAccount({
      actorUserId,
      organisationId: subject.organisationId,
    });
  }
  if (!billingAccountId) throw new Error('Billing account could not be resolved.');

  if (!await userCanManageBillingAccount(billingAccountId, actorUserId)) {
    throw new Error('The current user cannot manage this billing account.');
  }
  return billingAccountId;
}

async function getOrCreateCustomer(actorUserId: string, email: string, subject: BillingSubject) {
  const billingAccountId = await resolveBillingAccount(actorUserId, subject);
  const existingCustomerId = await getBillingCustomer(billingAccountId, getStripeLivemode());
  if (existingCustomerId) {
    return { billingAccountId, customerId: existingCustomerId };
  }

  const stripe = getStripeAdmin();
  const customer = await stripe.customers.create(
    { email, metadata: { supachargerBillingAccountId: billingAccountId } },
    { idempotencyKey: `supacharger-customer-${billingAccountId}-${getStripeLivemode() ? 'live' : 'test'}` },
  );
  const mapping = await putBillingCustomer(billingAccountId, customer.id, customer.livemode);
  if (!mapping) throw new Error('Stripe customer mapping is empty.');
  return { billingAccountId, customerId: mapping };
}

export async function getBillingOverviewForSubject(subjectInput: BillingSubject) {
  const subject = billingSubjectSchema.parse(subjectInput);
  assertSubjectEnabled(subject);
  const actor = await authenticatedActor();
  const overview = await actor.supabase.schema('api').rpc('get_billing_overview_by_current_user');
  if (overview.error) throw overview.error;
  const parsed = billingOverviewSchema.parse(overview.data ?? []);
  return parsed.filter((account) => billingAccountMatchesSubject(account, actor.id, subject));
}

export async function createBillingPortalUrl(subjectInput: BillingSubject, returnPath: string) {
  const subject = billingSubjectSchema.parse(subjectInput);
  const actor = await authenticatedActor();
  const { customerId } = await getOrCreateCustomer(actor.id, actor.email, subject);
  const portal = await getStripeAdmin().billingPortal.sessions.create({
    customer: customerId,
    return_url: getURL(returnPath),
  });
  return portal.url;
}

export async function createBillingCheckoutUrl(
  requestInput: unknown,
  paths: { cancel: string; success: string },
) {
  const request = billingCheckoutRequestSchema.parse(requestInput);
  const actor = await authenticatedActor();
  const { billingAccountId, customerId } = await getOrCreateCustomer(actor.id, actor.email, request.subject);
  const stripe = getStripeAdmin();
  const prices = await Promise.all(request.items.map((item) => stripe.prices.retrieve(item.priceId)));
  for (const price of prices) {
    if (!price.active || price.type !== 'recurring') {
      throw new Error(`Stripe Price ${price.id} is not an active recurring price.`);
    }
  }
  if (new Set(prices.map((price) => price.currency)).size !== 1) {
    throw new Error('All subscription items in one Checkout Session must use the same currency.');
  }

  const checkout = await stripe.checkout.sessions.create({
    allow_promotion_codes: SC_CONFIG.BILLING.ALLOW_PROMOTION_CODES,
    automatic_tax: { enabled: SC_CONFIG.BILLING.AUTOMATIC_TAX },
    billing_address_collection: SC_CONFIG.BILLING.BILLING_ADDRESS_COLLECTION,
    cancel_url: getURL(paths.cancel),
    client_reference_id: billingAccountId,
    customer: customerId,
    customer_update: { address: 'auto' },
    line_items: request.items.map((item, index) => ({ price: prices[index].id, quantity: item.quantity })),
    mode: 'subscription',
    subscription_data: {
      billing_mode: { type: 'flexible' },
      metadata: { supachargerBillingAccountId: billingAccountId },
    },
    success_url: getURL(paths.success),
  });
  if (!checkout.url) throw new Error('Stripe Checkout did not return a URL.');
  return checkout.url;
}
