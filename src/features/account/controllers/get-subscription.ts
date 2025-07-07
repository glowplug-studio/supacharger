import { createClient } from '@/lib/supabase/server';

export async function getSubscription() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('subscriptions')
    .select('*, prices(*, products(*))')
    .in('status', ['trialing', 'active'])
    .maybeSingle();

  if (error) {
    console.error(error);
  }

  return data;
}
