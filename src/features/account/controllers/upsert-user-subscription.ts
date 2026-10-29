import Stripe from 'stripe';

import { upsertPrice } from '@/features/pricing/controllers/upsert-price';
import { getStripeAdmin } from '@/lib/stripe/stripe-admin';
import { supabaseAdminClient } from '@/lib/supabase/supacharger/supabase-admin';
import { schemaName } from '@/supacharger/namespace';
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
  const { data: billingAccountId, error: noCustomerError } = await supabaseAdminClient
    .schema(schemaName('api_edge'))
    .rpc('billing_get_account_by_customer', { input_stripe_customer_id: customerId });
  if (noCustomerError) throw noCustomerError;
  if (!billingAccountId) throw new Error(`No Supacharger billing-account mapping exists for ${customerId}.`);

  const subscription = await getStripeAdmin().subscriptions.retrieve(subscriptionId, {
    expand: ['default_payment_method', 'items.data.price.product'],
  });

  const subscriptionItems = subscription.items.data;
  if (subscriptionItems.length === 0) {
    throw new Error(`Stripe subscription ${subscription.id} has no subscription items.`);
  }

  await Promise.all(subscriptionItems.map((item) => upsertPrice(item.price)));
  const primaryItem = subscriptionItems[0];
  const periodStart = Math.min(...subscriptionItems.map((item) => item.current_period_start));
  const periodEnd = Math.max(...subscriptionItems.map((item) => item.current_period_end));
  const latestInvoiceId =
    typeof subscription.latest_invoice === 'string' ? subscription.latest_invoice : subscription.latest_invoice?.id;

  const subscriptionData = {
    id: subscription.id,
    user_id: null,
    billing_account_id: billingAccountId,
    stripe_customer_id: customerId,
    metadata: subscription.metadata,
    status: supportedSubscriptionStatus(subscription.status),
    // Deprecated one-item aliases are populated during the migration window.
    price_id: primaryItem.price.id,
    quantity: primaryItem.quantity ?? null,
    cancel_at_period_end: subscription.cancel_at_period_end,
    cancel_at: subscription.cancel_at ? toDateTime(subscription.cancel_at).toISOString() : null,
    canceled_at: subscription.canceled_at ? toDateTime(subscription.canceled_at).toISOString() : null,
    current_period_start: toDateTime(periodStart).toISOString(),
    current_period_end: toDateTime(periodEnd).toISOString(),
    created: toDateTime(subscription.created).toISOString(),
    ended_at: subscription.ended_at ? toDateTime(subscription.ended_at).toISOString() : null,
    trial_start: subscription.trial_start ? toDateTime(subscription.trial_start).toISOString() : null,
    trial_end: subscription.trial_end ? toDateTime(subscription.trial_end).toISOString() : null,
    livemode: subscription.livemode,
    collection_method: subscription.collection_method,
    currency: subscription.currency,
    billing_mode: subscription.billing_mode.type,
    latest_invoice_id: latestInvoiceId ?? null,
    automatic_tax_enabled: subscription.automatic_tax.enabled,
  };

  const itemData = subscriptionItems.map((item) => ({
    id: item.id,
    price_id: item.price.id,
    quantity: item.quantity ?? null,
    metadata: item.metadata,
    current_period_start: toDateTime(item.current_period_start).toISOString(),
    current_period_end: toDateTime(item.current_period_end).toISOString(),
  }));

  const { error } = await supabaseAdminClient
    .schema(schemaName('api_edge'))
    .rpc('billing_upsert_subscription_v2', { input_subscription: subscriptionData, input_items: itemData });
  if (error) {
    throw error;
  }
  console.info(`Inserted/updated subscription [${subscription.id}] for billing account [${billingAccountId}]`);

  // For a new subscription copy the billing details to the customer object.
  // NOTE: This is a costly operation and should happen at the very end.
  if (isCreateAction && subscription.default_payment_method) {
    await copyBillingDetailsToCustomer(billingAccountId, subscription.default_payment_method as Stripe.PaymentMethod);
  }
}

const copyBillingDetailsToCustomer = async (billingAccountId: string, paymentMethod: Stripe.PaymentMethod) => {
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
    .schema(schemaName('api_edge'))
    .rpc('billing_update_payment_method_for_account', {
      input_billing_account_id: billingAccountId,
      input_billing_address: { ...address },
      input_payment_method: paymentMethodSummary,
    });

  if (error) {
    throw error;
  }
};
