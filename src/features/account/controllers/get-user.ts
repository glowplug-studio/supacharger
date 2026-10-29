import { createClient } from '@/lib/supabase/server'
import { schemaName } from '@/supacharger/namespace';

export async function getUser() {
  const supabase = await createClient();

  const { data, error } = await supabase.schema(schemaName('api')).rpc('get_account_profile_by_current_user');

  if (error) {
    console.error(error);
  }

  return data?.[0] ?? null;
}
