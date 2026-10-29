import type { ProductWithPrices } from '@/features/pricing/types';
import { createClient } from '@/lib/supabase/server'
import { schemaName } from '@/supacharger/namespace';

export async function getProducts(): Promise<ProductWithPrices[]> {
  const supabase = await createClient()

  const { data, error } = await supabase.schema(schemaName('api')).rpc('get_active_products');

  if (error) {
    console.error(error.message);
  }

  return (data ?? []) as unknown as ProductWithPrices[];
}
