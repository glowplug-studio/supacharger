import { getStripeAdmin } from '@/lib/stripe/stripe-admin';
import { supabaseAdminClient } from '@/lib/supabase/supacharger/supabase-admin';

export async function getOrCreateCustomer({ userId, email }: { userId: string; email: string }) {
  const { data, error } = await supabaseAdminClient
    .schema('app')
    .from('customers')
    .select('stripe_customer_id')
    .eq('id', userId)
    .maybeSingle();
  if (error) throw error;
  if (data?.stripe_customer_id) return data.stripe_customer_id;

  const customer = await getStripeAdmin().customers.create(
    { email, metadata: { userId } },
    { idempotencyKey: `supacharger-customer-${userId}` },
  );
  const { error: insertError } = await supabaseAdminClient
    .schema('app')
    .from('customers')
    .upsert({ id: userId, stripe_customer_id: customer.id }, { onConflict: 'id', ignoreDuplicates: true });
  if (insertError) throw insertError;

  const { data: mapping, error: mappingError } = await supabaseAdminClient
    .schema('app')
    .from('customers')
    .select('stripe_customer_id')
    .eq('id', userId)
    .single();
  if (mappingError) throw mappingError;
  if (!mapping.stripe_customer_id) throw new Error('Stripe customer mapping is empty.');
  return mapping.stripe_customer_id;
}
