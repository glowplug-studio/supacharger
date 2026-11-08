import Stripe from 'stripe';

import { getStripeAdmin } from '@/lib/stripe/stripe-admin';
import { supabaseAdminClient } from '@/lib/supabase/supacharger/supabase-admin';
import type { Database } from '@/lib/supabase/types';
import { schemaName } from '@/supacharger/namespace';

import { upsertProduct } from './upsert-product';

type Price = Database['app']['Tables']['prices']['Row'];
const supportedIntervals = ['day', 'week', 'month', 'year'] as const;
const supportedPriceTypes = ['one_time', 'recurring'] as const;

function supportedInterval(interval: Stripe.Price.Recurring.Interval | undefined) {
  if (!interval) return null;
  if (!supportedIntervals.includes(interval as (typeof supportedIntervals)[number])) {
    throw new Error(`Unsupported Stripe recurring interval: ${interval}`);
  }
  return interval as (typeof supportedIntervals)[number];
}

function supportedPriceType(type: Stripe.Price.Type) {
  if (!supportedPriceTypes.includes(type as (typeof supportedPriceTypes)[number])) {
    throw new Error(`Unsupported Stripe price type: ${type}`);
  }
  return type as (typeof supportedPriceTypes)[number];
}

export type StripeProductResolver = (productId: string) => Promise<Stripe.Product>;

export async function upsertPrice(
  price: Stripe.Price,
  resolveProduct: StripeProductResolver = (productId) => getStripeAdmin().products.retrieve(productId),
) {
  const product = typeof price.product === 'string'
    ? await resolveProduct(price.product)
    : price.product;
  if (product.deleted || !await upsertProduct(product)) return false;
  const productId = product.id;

  const priceData: Price = {
    id: price.id,
    product_id: productId,
    active: price.active,
    currency: price.currency,
    description: price.nickname ?? null,
    type: supportedPriceType(price.type),
    unit_amount: price.unit_amount ?? null,
    interval: supportedInterval(price.recurring?.interval),
    interval_count: price.recurring?.interval_count ?? null,
    trial_period_days: price.recurring?.trial_period_days ?? null,
    metadata: price.metadata,
  };

  const { error } = await supabaseAdminClient
    .schema(schemaName('api_edge'))
    .rpc('billing_upsert_price', { input_price: priceData });

  if (error) {
    throw error;
  } else {
    console.info(`Price inserted/updated: ${price.id}`);
  }
  return true;
}
