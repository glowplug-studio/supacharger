import { supabaseAdminClient } from '@/lib/supabase/supacharger/supabase-admin';

export async function getOrCreateUserBillingAccount(userId: string): Promise<string> {
  const { data, error } = await supabaseAdminClient
    .schema('api_edge')
    .rpc('billing_get_or_create_user_account', { input_user_id: userId });

  if (error) throw error;
  if (!data) throw new Error('Billing account could not be resolved.');
  return data;
}

export async function assertUserCanManageBillingAccount({
  billingAccountId,
  userId,
}: {
  billingAccountId: string;
  userId: string;
}) {
  const { data, error } = await supabaseAdminClient
    .schema('api_edge')
    .rpc('billing_user_can_manage', {
      input_billing_account_id: billingAccountId,
      input_user_id: userId,
    });

  if (error) throw error;
  if (!data) throw new Error('The current user cannot manage this billing account.');
}
