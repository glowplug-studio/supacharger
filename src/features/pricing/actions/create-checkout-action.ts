'use server';
import { redirect } from 'next/navigation';

import { getOrCreateUserBillingAccount } from '@/features/account/controllers/billing-account';
import { getOrCreateCustomer } from '@/features/account/controllers/get-or-create-customer';
import { Price } from '@/features/pricing/types';
import { getStripeAdmin } from '@/lib/stripe/stripe-admin';
import { getUser } from '@/lib/supabase/supacharger/supabase-auth';
import { SC_CONFIG } from '@/supacharger/supacharger-config';
import { getURL } from '@/supacharger/utils/helpers';

export type CheckoutLineItem = { priceId: string; quantity?: number };

export async function createCheckoutAction({
  price,
  items,
  billingAccountId,
}: {
  /** @deprecated Pass items for multi-item Checkout. */
  price?: Price;
  items?: CheckoutLineItem[];
  billingAccountId?: string;
}) {
  const supaUser = await getUser();
  if (!('user' in supaUser) || !supaUser.user.id || !supaUser.user.email) {
    throw new Error('An authenticated user with an email address is required.');
  }

  const requestedItems = items ?? (price ? [{ priceId: price.id, quantity: 1 }] : []);
  if (requestedItems.length === 0 || requestedItems.length > 20) {
    throw new Error('Checkout requires between 1 and 20 subscription items.');
  }
  for (const item of requestedItems) {
    if (!Number.isSafeInteger(item.quantity ?? 1) || (item.quantity ?? 1) < 1) {
      throw new Error('Checkout quantities must be positive integers.');
    }
  }

  const accountId = billingAccountId ?? (await getOrCreateUserBillingAccount(supaUser.user.id));

  const customer = await getOrCreateCustomer({
    userId: supaUser.user.id,
    email: supaUser.user.email,
    billingAccountId: accountId,
  });

  const stripe = getStripeAdmin();
  const stripePrices = await Promise.all(requestedItems.map((item) => stripe.prices.retrieve(item.priceId)));
  for (const stripePrice of stripePrices) {
    if (!stripePrice.active || stripePrice.type !== 'recurring') {
      throw new Error(`Stripe Price ${stripePrice.id} is not an active recurring price.`);
    }
  }
  const currencies = new Set(stripePrices.map((stripePrice) => stripePrice.currency));
  if (currencies.size !== 1) {
    throw new Error('All subscription items in one Checkout Session must use the same currency.');
  }

  const checkoutSession = await stripe.checkout.sessions.create({
    // Omitting payment_method_types enables Stripe Dynamic Payment Methods.
    automatic_tax: { enabled: SC_CONFIG.BILLING.AUTOMATIC_TAX },
    billing_address_collection: SC_CONFIG.BILLING.BILLING_ADDRESS_COLLECTION,
    customer,
    customer_update: {
      address: 'auto',
    },
    client_reference_id: accountId,
    line_items: requestedItems.map((item, index) => ({
      price: stripePrices[index].id,
      quantity: item.quantity ?? 1,
    })),
    mode: 'subscription',
    subscription_data: {
      billing_mode: { type: 'flexible' },
      metadata: { supachargerBillingAccountId: accountId },
    },
    allow_promotion_codes: SC_CONFIG.BILLING.ALLOW_PROMOTION_CODES,
    success_url: `${getURL()}/account`,
    cancel_url: `${getURL()}/`,
  });

  if (!checkoutSession || !checkoutSession.url) {
    throw Error('checkoutSession is not defined');
  }

  redirect(checkoutSession.url);
}
