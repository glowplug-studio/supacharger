import { NextResponse } from 'next/server';

import { reconcileStripeBilling } from '@/lib/stripe/stripe-reconciliation';
import { getEnvVar } from '@/supacharger/utils/helpers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const expectedSecret = getEnvVar(process.env.STRIPE_RECONCILIATION_SECRET, 'STRIPE_RECONCILIATION_SECRET');
  if (request.headers.get('authorization') !== `Bearer ${expectedSecret}`) {
    return new NextResponse(null, { status: 401 });
  }

  const result = await reconcileStripeBilling();
  return NextResponse.json(result, { status: result.failures.length === 0 ? 200 : 207 });
}
