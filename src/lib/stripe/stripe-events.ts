import type Stripe from 'stripe';

import { syncStripeEntitlements } from '@/features/account/controllers/sync-entitlements';
import { upsertUserSubscription } from '@/features/account/controllers/upsert-user-subscription';
import { upsertPrice } from '@/features/pricing/controllers/upsert-price';
import { upsertProduct } from '@/features/pricing/controllers/upsert-product';
import { getSupabaseAdminClient } from '@/lib/supabase/supacharger/supabase-admin';
import type { Json } from '@/lib/supabase/types';

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
  'entitlements.active_entitlement_summary.updated',
]);

function eventObjectId(event: Stripe.Event): string | null {
  const object = event.data.object as { id?: unknown };
  return typeof object.id === 'string' ? object.id : null;
}

export async function acceptStripeEvent(event: Stripe.Event): Promise<boolean> {
  if (!relevantEvents.has(event.type)) return false;

  const { data, error } = await getSupabaseAdminClient()
    .schema('api_edge')
    .rpc('accept_stripe_event', {
      p_event_id: event.id,
      p_event_type: event.type,
      p_object_id: eventObjectId(event) ?? '',
      p_api_version: event.api_version ?? 'unknown',
      p_livemode: event.livemode,
      p_payload: event as unknown as Json,
    });
  if (error) throw error;
  return data;
}

async function markProcessed(eventId: string) {
  const { error } = await getSupabaseAdminClient()
    .schema('api_edge')
    .rpc('complete_stripe_event', { p_event_id: eventId });

  if (error) throw error;
}

async function markFailed(eventId: string, error: unknown) {
  const message = error instanceof Error ? error.message : 'Unknown Stripe event processing error';
  const { error: updateError } = await getSupabaseAdminClient()
    .schema('api_edge')
    .rpc('complete_stripe_event', {
      p_event_id: eventId,
      p_error: message.slice(0, 1_000),
      p_retry_at: new Date(Date.now() + 60_000).toISOString(),
    });

  if (updateError) throw updateError;
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
        .schema('api_edge')
        .rpc('billing_set_catalogue_item_inactive', { p_kind: 'product', p_id: product.id });
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
        .schema('api_edge')
        .rpc('billing_set_catalogue_item_inactive', { p_kind: 'price', p_id: price.id });
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
    case 'checkout.session.async_payment_succeeded':
    case 'checkout.session.async_payment_failed': {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.mode !== 'subscription') return;
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
    case 'entitlements.active_entitlement_summary.updated': {
      const summary = event.data.object as Stripe.Entitlements.ActiveEntitlementSummary;
      await syncStripeEntitlements(summary.customer);
      return;
    }
  }
}

export async function processStripeEvent(eventId: string): Promise<boolean> {
  const { data: claimed, error: claimError } = await getSupabaseAdminClient()
    .schema('api_edge')
    .rpc('claim_stripe_event', { p_event_id: eventId });
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
    .schema('api_edge')
    .rpc('list_claimable_stripe_events', { p_limit: limit });
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
