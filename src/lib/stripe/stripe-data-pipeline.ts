import type Stripe from 'stripe';
import { z } from 'zod';

import { supabaseAdminClient } from '@/lib/supabase/supacharger/supabase-admin';
import { schemaName } from '@/supacharger/namespace';

import 'server-only';

const pipelineSchemaPattern = /^stripe_sdp(?:_[a-z0-9_]+)?$/;
const stripeObjectSchema = z.object({ id: z.string().min(1), object: z.string().min(1) }).passthrough();
const pipelineSnapshotSchema = z.object({
  prices: z.array(stripeObjectSchema),
  products: z.array(stripeObjectSchema),
  subscriptions: z.array(stripeObjectSchema),
});

export type StripeDataPipelineSnapshot = {
  prices: Stripe.Price[];
  products: Stripe.Product[];
  subscriptions: Stripe.Subscription[];
};

export function getStripeDataPipelineSchema(): string | null {
  const schema = process.env.STRIPE_DATA_PIPELINE_SCHEMA?.trim();
  if (!schema) return null;
  if (!pipelineSchemaPattern.test(schema)) {
    throw new Error('STRIPE_DATA_PIPELINE_SCHEMA must name a Stripe-managed stripe_sdp schema.');
  }
  return schema;
}

export async function readStripeDataPipeline(
  schema: string,
  livemode: boolean,
  customerIds: string[],
): Promise<StripeDataPipelineSnapshot> {
  const { data, error } = await supabaseAdminClient
    .schema(schemaName('api_edge'))
    .rpc('billing_read_stripe_data_pipeline', {
      input_customer_ids: customerIds,
      input_livemode: livemode,
      input_schema: schema,
    });
  if (error) throw error;

  const snapshot = pipelineSnapshotSchema.parse(data);
  return snapshot as unknown as StripeDataPipelineSnapshot;
}
