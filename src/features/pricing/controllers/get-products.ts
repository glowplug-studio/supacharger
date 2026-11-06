import type { ProductWithPrices } from '@/features/pricing/types';
import { createClient } from '@/lib/supabase/server'
import { schemaName } from '@/supacharger/namespace';
import { SC_CONFIG } from '@/supacharger/supacharger-config';

function productNamespace(product: ProductWithPrices) {
  const metadata = product.metadata;
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) return null;
  return typeof metadata.supacharger_application === 'string' ? metadata.supacharger_application : null;
}

export async function getProducts(): Promise<ProductWithPrices[]> {
  const supabase = await createClient()

  const { data, error } = await supabase.schema(schemaName('api')).rpc('get_active_products');

  if (error) {
    console.error(error.message);
  }

  return ((data ?? []) as unknown as ProductWithPrices[]).filter(
    (product) => productNamespace(product) === SC_CONFIG.BILLING.STRIPE_PRODUCT_NAMESPACE,
  );
}
