import { supabaseAdminClient } from '@/lib/supabase/supacharger/supabase-admin';

export async function getOrCreatePersonalBillingAccount(userId: string) {
  const { data, error } = await supabaseAdminClient.schema('api_edge')
    .rpc('billing_get_or_create_user_account', { input_user_id: userId });
  if (error) throw error;
  return data;
}

export async function userCanManageBillingAccount(billingAccountId: string, userId: string) {
  const { data, error } = await supabaseAdminClient.schema('api_edge').rpc('billing_user_can_manage', {
    input_billing_account_id: billingAccountId,
    input_user_id: userId,
  });
  if (error) throw error;
  return data;
}

export async function getBillingCustomer(billingAccountId: string, livemode: boolean) {
  const { data, error } = await supabaseAdminClient.schema('api_edge').rpc('billing_get_customer_for_account', {
    input_billing_account_id: billingAccountId,
    input_livemode: livemode,
  }).maybeSingle();
  if (error) throw error;
  return data?.stripe_customer_id ?? null;
}

export async function putBillingCustomer(billingAccountId: string, stripeCustomerId: string, livemode: boolean) {
  const { data, error } = await supabaseAdminClient.schema('api_edge').rpc('billing_put_customer_for_account', {
    input_billing_account_id: billingAccountId,
    input_livemode: livemode,
    input_stripe_customer_id: stripeCustomerId,
  });
  if (error) throw error;
  return data;
}
