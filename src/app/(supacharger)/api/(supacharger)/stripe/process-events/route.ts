import { NextResponse } from 'next/server';

import { processPendingStripeEvents } from '@/lib/stripe/stripe-events';
import { getEnvVar } from '@/supacharger/utils/helpers';

export async function POST(request: Request) {
  const expectedSecret = getEnvVar(process.env.STRIPE_EVENT_PROCESSOR_SECRET, 'STRIPE_EVENT_PROCESSOR_SECRET');
  if (request.headers.get('authorization') !== `Bearer ${expectedSecret}`) {
    return new NextResponse(null, { status: 401 });
  }

  const processed = await processPendingStripeEvents();
  return NextResponse.json({ processed });
}
