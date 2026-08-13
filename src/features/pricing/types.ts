import { Database } from '@/lib/supabase/types';

export type BillingInterval = 'year' | 'month';
export type Subscription = Database['app']['Tables']['subscriptions']['Row'];
export type Product = Database['app']['Tables']['products']['Row'];
export type Price = Database['app']['Tables']['prices']['Row'];
export type ProductWithPrices = Product & { prices: Price[] };
export type PriceWithProduct = Price & { products: Product | null };
export type SubscriptionWithProduct = Subscription & { prices: PriceWithProduct | null };
