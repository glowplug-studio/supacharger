import Stripe from 'stripe';

import { supabaseAdminClient } from '@/lib/supabase/supacharger/supabase-admin';
import type { Database } from '@/lib/supabase/types';
import { schemaName } from '@/supacharger/namespace';
import { SC_CONFIG } from '@/supacharger/supacharger-config';

type Product = Database['app']['Tables']['products']['Row'];

export async function upsertProduct(product: Stripe.Product) {
  if (product.metadata.supacharger_application !== SC_CONFIG.BILLING.STRIPE_PRODUCT_NAMESPACE) return false;

  const productData: Product = {
    id: product.id,
    active: product.active,
    name: product.name,
    description: product.description ?? null,
    image: product.images?.[0] ?? null,
    metadata: product.metadata,
  };

  const { error } = await supabaseAdminClient
    .schema(schemaName('api_edge'))
    .rpc('billing_upsert_product', { input_product: productData });

  if (error) {
    throw error;
  } else {
    console.info(`Product inserted/updated: ${product.id}`);
  }
  return true;
}
