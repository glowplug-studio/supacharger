import { syncStripeEntitlements } from '@/features/account/controllers/sync-entitlements';
import {
  upsertSubscriptionSnapshot,
  upsertUserSubscription,
} from '@/features/account/controllers/upsert-user-subscription';
import { upsertPrice } from '@/features/pricing/controllers/upsert-price';
import { upsertProduct } from '@/features/pricing/controllers/upsert-product';
import { getStripeAdmin, getStripeLivemode } from '@/lib/stripe/stripe-admin';
import { getStripeDataPipelineSchema, readStripeDataPipeline } from '@/lib/stripe/stripe-data-pipeline';
import { supabaseAdminClient } from '@/lib/supabase/supacharger/supabase-admin';
import { schemaName } from '@/supacharger/namespace';

import 'server-only';

export type BillingReconciliationResult = {
  customers: number;
  prices: number;
  products: number;
  subscriptions: number;
  failures: Array<{ customerId: string; message: string }>;
};

export async function reconcileStripeBilling(): Promise<BillingReconciliationResult> {
  const { data: mappings, error } = await supabaseAdminClient
    .schema(schemaName('api_edge'))
    .rpc('billing_list_customer_mappings');
  if (error) throw error;

  const result: BillingReconciliationResult = { customers: 0, prices: 0, products: 0, subscriptions: 0, failures: [] };

  const pipelineSchema = getStripeDataPipelineSchema();
  if (pipelineSchema) {
    return reconcileStripeDataPipeline(
      pipelineSchema,
      (mappings ?? []).filter((mapping) => mapping.livemode === null || mapping.livemode === getStripeLivemode()),
      result,
    );
  }

  for await (const product of getStripeAdmin().products.list({ limit: 100 })) {
    if (!await upsertProduct(product)) continue;
    result.products += 1;
    for await (const price of getStripeAdmin().prices.list({ limit: 100, product: product.id })) {
      if (await upsertPrice(price)) result.prices += 1;
    }
  }

  for (const mapping of mappings ?? []) {
    if (mapping.livemode !== null && mapping.livemode !== getStripeLivemode()) continue;
    result.customers += 1;
    try {
      for await (const subscription of getStripeAdmin().subscriptions.list({
        customer: mapping.stripe_customer_id,
        status: 'all',
        limit: 100,
      })) {
        await upsertUserSubscription({
          subscriptionId: subscription.id,
          customerId: mapping.stripe_customer_id,
        });
        result.subscriptions += 1;
      }
      await syncStripeEntitlements(mapping.stripe_customer_id);
    } catch (cause) {
      result.failures.push({
        customerId: mapping.stripe_customer_id,
        message: cause instanceof Error ? cause.message : 'Unknown reconciliation failure',
      });
    }
  }

  return result;
}

async function reconcileStripeDataPipeline(
  pipelineSchema: string,
  mappings: Array<{ stripe_customer_id: string }>,
  result: BillingReconciliationResult,
) {
  const snapshot = await readStripeDataPipeline(
    pipelineSchema,
    getStripeLivemode(),
    mappings.map((mapping) => mapping.stripe_customer_id),
  );
  const products = new Map(snapshot.products.map((product) => [product.id, product]));
  const resolveProduct = async (productId: string) => {
    const product = products.get(productId);
    if (!product) throw new Error(`Stripe Data Pipeline does not contain product ${productId}.`);
    return product;
  };

  for (const product of snapshot.products) {
    if (await upsertProduct(product)) result.products += 1;
  }
  for (const price of snapshot.prices) {
    if (await upsertPrice(price, resolveProduct)) result.prices += 1;
  }

  const subscriptionsByCustomer = Map.groupBy(snapshot.subscriptions, (subscription) => {
    return typeof subscription.customer === 'string' ? subscription.customer : subscription.customer.id;
  });
  for (const mapping of mappings) {
    result.customers += 1;
    try {
      for (const subscription of subscriptionsByCustomer.get(mapping.stripe_customer_id) ?? []) {
        await upsertSubscriptionSnapshot({
          customerId: mapping.stripe_customer_id,
          resolveProduct,
          subscription,
        });
        result.subscriptions += 1;
      }
      await syncStripeEntitlements(mapping.stripe_customer_id);
    } catch (cause) {
      result.failures.push({
        customerId: mapping.stripe_customer_id,
        message: cause instanceof Error ? cause.message : 'Unknown reconciliation failure',
      });
    }
  }

  return result;
}
