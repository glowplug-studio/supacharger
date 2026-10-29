import { createClient } from '@/lib/supabase/server';
import { schemaName } from '@/supacharger/namespace';

export async function getSubscription() {
  const supabase = await createClient();

  const { data, error } = await supabase.schema(schemaName('api')).rpc('get_active_subscription_by_current_user');

  if (error) {
    console.error(error);
  }

  return data;
}
