import Stripe from 'stripe';

import { getEnvVar } from '@/supacharger/utils/helpers';

import 'server-only';

export const STRIPE_API_VERSION: Stripe.LatestApiVersion = '2026-09-30.endive';

let stripeAdmin: Stripe | undefined;

export function getStripeAdmin(): Stripe {
  stripeAdmin ??= new Stripe(getEnvVar(process.env.STRIPE_SECRET_KEY, 'STRIPE_SECRET_KEY'), {
    apiVersion: STRIPE_API_VERSION,
    maxNetworkRetries: 2,
  });

  return stripeAdmin;
}

export function getStripeLivemode(): boolean {
  return getEnvVar(process.env.STRIPE_SECRET_KEY, 'STRIPE_SECRET_KEY').startsWith('sk_live_');
}
