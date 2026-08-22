import {
  assertUserCanManageBillingAccount,
  getOrCreateUserBillingAccount,
} from '@/features/account/controllers/billing-account';
import { getStripeAdmin, getStripeLivemode } from '@/lib/stripe/stripe-admin';
import { supabaseAdminClient } from '@/lib/supabase/supacharger/supabase-admin';

export async function getOrCreateCustomer({
  userId,
  email,
  billingAccountId,
}: {
  userId: string;
  email: string;
  billingAccountId?: string;
}) {
  const accountId = billingAccountId ?? (await getOrCreateUserBillingAccount(userId));
  await assertUserCanManageBillingAccount({ billingAccountId: accountId, userId });

  const { data, error } = await supabaseAdminClient
    .schema('api_edge')
    .rpc('billing_get_customer_for_account', {
      input_billing_account_id: accountId,
      input_livemode: getStripeLivemode(),
    })
    .maybeSingle();
  if (error) throw error;
  if (data?.stripe_customer_id) return data.stripe_customer_id;

  const customer = await getStripeAdmin().customers.create(
    { email, metadata: { supachargerBillingAccountId: accountId } },
    { idempotencyKey: `supacharger-customer-${accountId}-${getStripeLivemode() ? 'live' : 'test'}` },
  );
  const { data: mapping, error: insertError } = await supabaseAdminClient
    .schema('api_edge')
    .rpc('billing_put_customer_for_account', {
      input_billing_account_id: accountId,
      input_stripe_customer_id: customer.id,
      input_livemode: customer.livemode,
    });
  if (insertError) throw insertError;
  if (!mapping) throw new Error('Stripe customer mapping is empty.');
  return mapping;
}
