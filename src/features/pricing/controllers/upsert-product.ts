import Stripe from 'stripe';

import { supabaseAdminClient } from '@/lib/supabase/supacharger/supabase-admin';
import type { Database } from '@/lib/supabase/types';

type Product = Database['app']['Tables']['products']['Row'];

export async function upsertProduct(product: Stripe.Product) {
  const productData: Product = {
    id: product.id,
    active: product.active,
    name: product.name,
    description: product.description ?? null,
    image: product.images?.[0] ?? null,
    metadata: product.metadata,
  };

  const { error } = await supabaseAdminClient
    .schema('api_edge')
    .rpc('billing_upsert_product', { p_product: productData });

  if (error) {
    throw error;
  } else {
    console.info(`Product inserted/updated: ${product.id}`);
  }
}
