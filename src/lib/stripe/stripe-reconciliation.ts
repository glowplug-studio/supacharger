import { syncStripeEntitlements } from '@/features/account/controllers/sync-entitlements';
import { upsertUserSubscription } from '@/features/account/controllers/upsert-user-subscription';
import { getStripeAdmin, getStripeLivemode } from '@/lib/stripe/stripe-admin';
import { supabaseAdminClient } from '@/lib/supabase/supacharger/supabase-admin';
import { schemaName } from '@/supacharger/namespace';

import 'server-only';

export type BillingReconciliationResult = {
  customers: number;
  subscriptions: number;
  failures: Array<{ customerId: string; message: string }>;
};

export async function reconcileStripeBilling(): Promise<BillingReconciliationResult> {
  const { data: mappings, error } = await supabaseAdminClient
    .schema(schemaName('api_edge'))
    .rpc('billing_list_customer_mappings');
  if (error) throw error;

  const result: BillingReconciliationResult = { customers: 0, subscriptions: 0, failures: [] };

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
