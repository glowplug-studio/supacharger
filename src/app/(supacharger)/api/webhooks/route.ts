import { after } from 'next/server';
import Stripe from 'stripe';

import { getStripeAdmin } from '@/lib/stripe/stripe-admin';
import { acceptStripeEvent, processStripeEvent } from '@/lib/stripe/stripe-events';
import { getEnvVar } from '@/supacharger/utils/helpers';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const arrayBuffer = await req.arrayBuffer();
  const rawBody = Buffer.from(arrayBuffer).toString('utf8');

  const sig = req.headers.get('stripe-signature');
  const webhookSecret = getEnvVar(process.env.STRIPE_WEBHOOK_SECRET, 'STRIPE_WEBHOOK_SECRET');

  if (!sig || !webhookSecret) {
    return new Response('Missing Stripe signature or webhook secret', { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = getStripeAdmin().webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err: any) {
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  try {
    const accepted = await acceptStripeEvent(event);
    if (accepted) {
      after(() => processStripeEvent(event.id));
    }
  } catch (error) {
    console.error('Stripe webhook event could not be durably accepted', { eventId: event.id, error });
    return new Response('Webhook event was not accepted.', { status: 500 });
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
