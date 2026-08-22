import { getStripeLivemode } from '@/lib/stripe/stripe-admin';
import { supabaseAdminClient } from '@/lib/supabase/supacharger/supabase-admin';

import { assertUserCanManageBillingAccount, getOrCreateUserBillingAccount } from './billing-account';

export async function getCustomerId({ userId, billingAccountId }: { userId: string; billingAccountId?: string }) {
  const accountId = billingAccountId ?? (await getOrCreateUserBillingAccount(userId));
  await assertUserCanManageBillingAccount({ billingAccountId: accountId, userId });
  const { data, error } = await supabaseAdminClient
    .schema('api_edge')
    .rpc('billing_get_customer_for_account', {
      input_billing_account_id: accountId,
      input_livemode: getStripeLivemode(),
    })
    .single();

  if (error) {
    throw new Error('Error fetching stripe_customer_id');
  }

  return data.stripe_customer_id;
}
