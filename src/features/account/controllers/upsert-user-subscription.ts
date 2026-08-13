import Stripe from 'stripe';

import { upsertPrice } from '@/features/pricing/controllers/upsert-price';
import { getStripeAdmin } from '@/lib/stripe/stripe-admin';
import { supabaseAdminClient } from '@/lib/supabase/supacharger/supabase-admin';
import type { Database } from '@/lib/supabase/types';
import { toDateTime } from '@/supacharger/utils/helpers';

const supportedSubscriptionStatuses = [
  'trialing',
  'active',
  'canceled',
  'incomplete',
  'incomplete_expired',
  'past_due',
  'unpaid',
  'paused',
] as const;

function supportedSubscriptionStatus(status: Stripe.Subscription.Status) {
  if (!supportedSubscriptionStatuses.includes(status as (typeof supportedSubscriptionStatuses)[number])) {
    throw new Error(`Unsupported Stripe subscription status: ${status}`);
  }
  return status as (typeof supportedSubscriptionStatuses)[number];
}

export async function upsertUserSubscription({
  subscriptionId,
  customerId,
  isCreateAction,
}: {
  subscriptionId: string;
  customerId: string;
  isCreateAction?: boolean;
}) {
  // Get customer's userId from mapping table.
  const { data: customerData, error: noCustomerError } = await supabaseAdminClient
    .schema('app')
    .from('customers')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .single();
  if (noCustomerError) throw noCustomerError;

  const { id: userId } = customerData!;

  const subscription = await getStripeAdmin().subscriptions.retrieve(subscriptionId, {
    expand: ['default_payment_method', 'items.data.price.product'],
  });

  const primaryItem = subscription.items.data[0];
  if (!primaryItem) {
    throw new Error(`Stripe subscription ${subscription.id} has no subscription items.`);
  }

  await upsertPrice(primaryItem.price);

  // Upsert the latest status of the subscription object.
  const subscriptionData: Database['app']['Tables']['subscriptions']['Insert'] = {
    id: subscription.id,
    user_id: userId,
    metadata: subscription.metadata,
    status: supportedSubscriptionStatus(subscription.status),
    price_id: primaryItem.price.id,
    quantity: primaryItem.quantity ?? null,
    cancel_at_period_end: subscription.cancel_at_period_end,
    cancel_at: subscription.cancel_at ? toDateTime(subscription.cancel_at).toISOString() : null,
    canceled_at: subscription.canceled_at ? toDateTime(subscription.canceled_at).toISOString() : null,
    current_period_start: toDateTime(primaryItem.current_period_start).toISOString(),
    current_period_end: toDateTime(primaryItem.current_period_end).toISOString(),
    created: toDateTime(subscription.created).toISOString(),
    ended_at: subscription.ended_at ? toDateTime(subscription.ended_at).toISOString() : null,
    trial_start: subscription.trial_start ? toDateTime(subscription.trial_start).toISOString() : null,
    trial_end: subscription.trial_end ? toDateTime(subscription.trial_end).toISOString() : null,
  };

  const { error } = await supabaseAdminClient.schema('app').from('subscriptions').upsert([subscriptionData]);
  if (error) {
    throw error;
  }
  console.info(`Inserted/updated subscription [${subscription.id}] for user [${userId}]`);

  // For a new subscription copy the billing details to the customer object.
  // NOTE: This is a costly operation and should happen at the very end.
  if (isCreateAction && subscription.default_payment_method && userId) {
    await copyBillingDetailsToCustomer(userId, subscription.default_payment_method as Stripe.PaymentMethod);
  }
}

const copyBillingDetailsToCustomer = async (userId: string, paymentMethod: Stripe.PaymentMethod) => {
  const customer = paymentMethod.customer;
  if (typeof customer !== 'string') {
    throw new Error('Customer id not found');
  }

  const { name, phone, address } = paymentMethod.billing_details;
  if (!name || !phone || !address) return;

  const paymentMethodSummary =
    paymentMethod.type === 'card' && paymentMethod.card
      ? {
          type: 'card',
          brand: paymentMethod.card.brand,
          last4: paymentMethod.card.last4,
          exp_month: paymentMethod.card.exp_month,
          exp_year: paymentMethod.card.exp_year,
        }
      : { type: paymentMethod.type };

  await getStripeAdmin().customers.update(customer, {
    name,
    phone,
    address: address as Stripe.AddressParam,
  });

  const { error } = await supabaseAdminClient
    .schema('app')
    .from('users')
    .update({
      billing_address: { ...address },
      payment_method: paymentMethodSummary,
    })
    .eq('id', userId);

  if (error) {
    throw error;
  }
};
