import type Stripe from 'stripe';

import { syncStripeEntitlements } from '@/features/account/controllers/sync-entitlements';
import { upsertUserSubscription } from '@/features/account/controllers/upsert-user-subscription';
import { upsertPrice } from '@/features/pricing/controllers/upsert-price';
import { upsertProduct } from '@/features/pricing/controllers/upsert-product';
import { getStripeAdmin } from '@/lib/stripe/stripe-admin';
import { getSupabaseAdminClient } from '@/lib/supabase/supacharger/supabase-admin';
import type { Json } from '@/lib/supabase/types';
import { schemaName } from '@/supacharger/namespace';

import 'server-only';

const relevantEvents = new Set([
  'product.created',
  'product.updated',
  'product.deleted',
  'price.created',
  'price.updated',
  'price.deleted',
  'checkout.session.completed',
  'checkout.session.async_payment_succeeded',
  'checkout.session.async_payment_failed',
  'customer.subscription.created',
  'customer.subscription.updated',
  'customer.subscription.deleted',
  'customer.subscription.paused',
  'customer.subscription.resumed',
  'invoice.paid',
  'invoice.payment_failed',
  'charge.refunded',
  'charge.dispute.created',
  'radar.early_fraud_warning.created',
  'entitlements.active_entitlement_summary.updated',
]);

function eventObjectId(event: Stripe.Event): string | null {
  const object = event.data.object as { id?: unknown };
  return typeof object.id === 'string' ? object.id : null;
}

export async function acceptStripeEvent(event: Stripe.Event): Promise<boolean> {
  if (!relevantEvents.has(event.type)) return false;

  const { data, error } = await getSupabaseAdminClient()
    .schema(schemaName('api_edge'))
    .rpc('accept_stripe_event', {
      input_event_id: event.id,
      input_event_type: event.type,
      input_object_id: eventObjectId(event) ?? '',
      input_api_version: event.api_version ?? 'unknown',
      input_livemode: event.livemode,
      input_payload: event as unknown as Json,
    });
  if (error) throw error;
  return data;
}

async function markProcessed(eventId: string) {
  const { error } = await getSupabaseAdminClient()
    .schema(schemaName('api_edge'))
    .rpc('complete_stripe_event', { input_event_id: eventId });

  if (error) throw error;
}

async function markFailed(eventId: string, error: unknown) {
  const message = error instanceof Error ? error.message : 'Unknown Stripe event processing error';
  const { error: updateError } = await getSupabaseAdminClient()
    .schema(schemaName('api_edge'))
    .rpc('complete_stripe_event', {
      input_event_id: eventId,
      input_error: message.slice(0, 1_000),
      input_retry_at: new Date(Date.now() + 60_000).toISOString(),
    });

  if (updateError) throw updateError;
}

async function syncSubscriptionForInvoice(invoice: Stripe.Invoice) {
  const subscription = invoice.parent?.subscription_details?.subscription;
  const customer = invoice.customer;
  const subscriptionId = typeof subscription === 'string' ? subscription : subscription?.id;
  const customerId = typeof customer === 'string' ? customer : customer?.id;
  if (!subscriptionId || !customerId) return;
  await upsertUserSubscription({ subscriptionId, customerId, isCreateAction: false });
}

async function syncSubscriptionsForPaymentIntent(paymentIntentId: string) {
  for await (const payment of getStripeAdmin().invoicePayments.list({
    payment: { payment_intent: paymentIntentId, type: 'payment_intent' },
    status: 'paid',
  })) {
    const invoiceId = typeof payment.invoice === 'string' ? payment.invoice : payment.invoice.id;
    const invoice = await getStripeAdmin().invoices.retrieve(invoiceId);
    await syncSubscriptionForInvoice(invoice);
  }
}

async function paymentIntentIdForRiskEvent(event: Stripe.Event) {
  const object = event.data.object;
  if (event.type === 'charge.refunded') {
    const paymentIntent = (object as Stripe.Charge).payment_intent;
    return typeof paymentIntent === 'string' ? paymentIntent : paymentIntent?.id ?? null;
  }

  const riskObject = object as Stripe.Dispute | Stripe.Radar.EarlyFraudWarning;
  const paymentIntent = riskObject.payment_intent;
  if (paymentIntent) return typeof paymentIntent === 'string' ? paymentIntent : paymentIntent.id;
  const chargeId = typeof riskObject.charge === 'string' ? riskObject.charge : riskObject.charge.id;
  const charge = await getStripeAdmin().charges.retrieve(chargeId);
  return typeof charge.payment_intent === 'string' ? charge.payment_intent : charge.payment_intent?.id ?? null;
}

async function processEvent(event: Stripe.Event) {
  switch (event.type) {
    case 'product.created':
    case 'product.updated':
      await upsertProduct(event.data.object as Stripe.Product);
      return;
    case 'product.deleted': {
      const product = event.data.object as Stripe.Product;
      const { error } = await getSupabaseAdminClient()
        .schema(schemaName('api_edge'))
        .rpc('billing_set_catalogue_item_inactive', { input_kind: 'product', input_id: product.id });
      if (error) throw error;
      return;
    }
    case 'price.created':
    case 'price.updated':
      await upsertPrice(event.data.object as Stripe.Price);
      return;
    case 'price.deleted': {
      const price = event.data.object as Stripe.Price;
      const { error } = await getSupabaseAdminClient()
        .schema(schemaName('api_edge'))
        .rpc('billing_set_catalogue_item_inactive', { input_kind: 'price', input_id: price.id });
      if (error) throw error;
      return;
    }
    case 'customer.subscription.created':
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted':
    case 'customer.subscription.paused':
    case 'customer.subscription.resumed': {
      const subscription = event.data.object as Stripe.Subscription;
      await upsertUserSubscription({
        subscriptionId: subscription.id,
        customerId: subscription.customer as string,
        isCreateAction: false,
      });
      return;
    }
    case 'checkout.session.completed':
    case 'checkout.session.async_payment_succeeded': {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.payment_status === 'unpaid' || session.mode !== 'subscription') return;
      if (typeof session.subscription !== 'string' || typeof session.customer !== 'string') {
        throw new Error(`Checkout Session ${session.id} is missing its subscription or customer ID.`);
      }
      await upsertUserSubscription({
        subscriptionId: session.subscription,
        customerId: session.customer,
        isCreateAction: true,
      });
      return;
    }
    case 'checkout.session.async_payment_failed':
      return;
    case 'invoice.paid':
    case 'invoice.payment_failed':
      await syncSubscriptionForInvoice(event.data.object as Stripe.Invoice);
      return;
    case 'charge.refunded':
    case 'charge.dispute.created':
    case 'radar.early_fraud_warning.created': {
      const paymentIntentId = await paymentIntentIdForRiskEvent(event);
      if (paymentIntentId) await syncSubscriptionsForPaymentIntent(paymentIntentId);
      return;
    }
    case 'entitlements.active_entitlement_summary.updated': {
      const summary = event.data.object as Stripe.Entitlements.ActiveEntitlementSummary;
      await syncStripeEntitlements(summary.customer);
      return;
    }
  }
}

export async function processStripeEvent(eventId: string): Promise<boolean> {
  const { data: claimed, error: claimError } = await getSupabaseAdminClient()
    .schema(schemaName('api_edge'))
    .rpc('claim_stripe_event', { input_event_id: eventId });
  if (claimError) throw claimError;
  if (!claimed) return false;

  try {
    const event = claimed as unknown as Stripe.Event;
    await processEvent(event);
    await markProcessed(eventId);
    return true;
  } catch (error) {
    await markFailed(eventId, error);
    throw error;
  }
}

export async function processPendingStripeEvents(limit = 20): Promise<number> {
  const { data, error } = await getSupabaseAdminClient()
    .schema(schemaName('api_edge'))
    .rpc('list_claimable_stripe_events', { result_limit: limit });
  if (error) throw error;

  let processed = 0;
  for (const row of data ?? []) {
    try {
      if (await processStripeEvent(row.event_id)) processed += 1;
    } catch (error) {
      console.error('Stripe event processing failed', { eventId: row.event_id, error });
    }
  }
  return processed;
}
