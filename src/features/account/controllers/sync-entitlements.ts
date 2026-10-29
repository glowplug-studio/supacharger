import { getStripeAdmin } from '@/lib/stripe/stripe-admin';
import { supabaseAdminClient } from '@/lib/supabase/supacharger/supabase-admin';
import { schemaName } from '@/supacharger/namespace';

export async function syncStripeEntitlements(customerId: string) {
  const entitlements: Array<{ id: string; lookup_key: string }> = [];

  for await (const entitlement of getStripeAdmin().entitlements.activeEntitlements.list({
    customer: customerId,
    limit: 100,
  })) {
    entitlements.push({ id: entitlement.id, lookup_key: entitlement.lookup_key });
  }

  const { error } = await supabaseAdminClient
    .schema(schemaName('api_edge'))
    .rpc('billing_replace_stripe_entitlements', {
      input_stripe_customer_id: customerId,
      input_entitlements: entitlements,
    });

  if (error) throw error;
}
