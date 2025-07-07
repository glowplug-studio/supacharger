import Stripe from 'stripe';

import { getEnvVar } from '@/supacharger/utils/helpers';

export const stripeAdmin = new Stripe(getEnvVar(process.env.STRIPE_SECRET_KEY, 'STRIPE_SECRET_KEY'), {
  apiVersion: '2025-04-30.basil',
});
