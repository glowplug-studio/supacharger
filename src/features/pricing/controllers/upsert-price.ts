import Stripe from 'stripe';

import { supabaseAdminClient } from '@/lib/supabase/supacharger/supabase-admin';
import type { Database } from '@/lib/supabase/types';

import { upsertProduct } from './upsert-product';

type Price = Database['app']['Tables']['prices']['Row'];
const supportedIntervals = ['day', 'week', 'month', 'year'] as const;

function supportedInterval(interval: Stripe.Price.Recurring.Interval | undefined) {
  if (!interval) return null;
  if (!supportedIntervals.includes(interval as (typeof supportedIntervals)[number])) {
    throw new Error(`Unsupported Stripe recurring interval: ${interval}`);
  }
  return interval as (typeof supportedIntervals)[number];
}

export async function upsertPrice(price: Stripe.Price) {
  const productId = typeof price.product === 'string' ? price.product : price.product.id;

  if (typeof price.product !== 'string' && !price.product.deleted) {
    await upsertProduct(price.product);
  }

  const priceData: Price = {
    id: price.id,
    product_id: productId,
    active: price.active,
    currency: price.currency,
    description: price.nickname ?? null,
    type: price.type,
    unit_amount: price.unit_amount ?? null,
    interval: supportedInterval(price.recurring?.interval),
    interval_count: price.recurring?.interval_count ?? null,
    trial_period_days: price.recurring?.trial_period_days ?? null,
    metadata: price.metadata,
  };

  const { error } = await supabaseAdminClient
    .schema('api_edge')
    .rpc('billing_upsert_price', { input_price: priceData });

  if (error) {
    throw error;
  } else {
    console.info(`Price inserted/updated: ${price.id}`);
  }
}
