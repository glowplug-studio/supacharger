'use server';
import { redirect } from 'next/navigation';

import { Price } from '@/features/pricing/types';
import { createBillingCheckoutUrl } from '@/supacharger/billing/billing-service';

export type CheckoutLineItem = { priceId: string; quantity?: number };

export async function createCheckoutAction({
  price,
  items,
}: {
  /** @deprecated Pass items for multi-item Checkout. */
  price?: Price;
  items?: CheckoutLineItem[];
}) {
  const requestedItems = items ?? (price ? [{ priceId: price.id, quantity: 1 }] : []);
  const destination = await createBillingCheckoutUrl(
    {
      items: requestedItems.map((item) => ({ priceId: item.priceId, quantity: item.quantity ?? 1 })),
      subject: { type: 'personal' },
    },
    { cancel: '/account/billing/subscribe?checkout=cancelled', success: '/account/billing?checkout=success' },
  );
  redirect(destination);
}
