import { createClient } from '@/lib/supabase/server';
import type { Json } from '@/lib/supabase/types';

export type BillingItemOverview = {
  id: string;
  quantity: number | null;
  current_period_start: string;
  current_period_end: string;
  price: {
    id: string;
    currency: string | null;
    unit_amount: number | null;
    product: { id: string; name: string | null } | null;
  };
};

export type BillingSubscriptionOverview = {
  id: string;
  status: string | null;
  billing_mode: 'classic' | 'flexible' | null;
  currency: string | null;
  cancel_at_period_end: boolean | null;
  items: BillingItemOverview[];
};

export type BillingAccountOverview = {
  id: string;
  subject_type: 'user' | 'organisation' | 'team' | 'tenant' | 'custom';
  display_name: string | null;
  member_role: 'owner' | 'billing_admin' | 'member';
  subscriptions: BillingSubscriptionOverview[];
  entitlements: Array<{ feature_lookup_key: string; source: string; metadata: Json }>;
};

export async function getBillingOverview(): Promise<BillingAccountOverview[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.schema('api').rpc('get_billing_overview_by_current_user');
  if (error) throw error;
  return (data ?? []) as unknown as BillingAccountOverview[];
}
