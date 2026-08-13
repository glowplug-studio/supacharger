'use server';
import { redirect } from 'next/navigation';

import { getOrCreateCustomer } from '@/features/account/controllers/get-or-create-customer';
import { Price } from '@/features/pricing/types';
import { getStripeAdmin } from '@/lib/stripe/stripe-admin';
import { getUser } from '@/lib/supabase/supacharger/supabase-auth';
import { getURL } from '@/supacharger/utils/helpers';

export async function createCheckoutAction({ price }: { price: Price }) {
  // 1. Get the user from session
  var supaUser = await getUser();

  // 2. Retrieve or create the customer in Stripe
  const customer = await getOrCreateCustomer({
    // @ts-ignore
    userId: supaUser.user.id,
    // @ts-ignore
    email: supaUser.user.email,
  });



  // Resolve the client-provided identifier against this Stripe account. The
  // client cannot select payment mode or make an inactive/one-time price valid.
  const stripe = getStripeAdmin();
  const stripePrice = await stripe.prices.retrieve(price.id);
  if (!stripePrice.active || stripePrice.type !== 'recurring') {
    throw new Error('Only active recurring Stripe prices are supported.');
  }

  // 3. Create a checkout session in Stripe
  const checkoutSession = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    billing_address_collection: 'required',
    customer,
    customer_update: {
      address: 'auto',
    },
    line_items: [
      {
        price: stripePrice.id,
        quantity: 1,
      },
    ],
    mode: 'subscription',
    allow_promotion_codes: true,
    success_url: `${getURL()}/account`,
    cancel_url: `${getURL()}/`,
  });

  if (!checkoutSession || !checkoutSession.url) {
    throw Error('checkoutSession is not defined');
  }

  // 4. Redirect to checkout url
  redirect(checkoutSession.url);
}
