import { redirect } from 'next/navigation';
import { connection } from 'next/server';
import { z } from 'zod';

import { createBillingPortalUrl } from '@/supacharger/billing/billing-service';

const portalRequestSchema = z.object({ subjectType: z.literal('personal') });

export async function POST(request: Request) {
  await connection();
  const formData = await request.formData();
  const parsed = portalRequestSchema.safeParse({ subjectType: formData.get('subjectType') });
  let destination = '/account/billing?portal=error';
  if (parsed.success) {
    try {
      destination = await createBillingPortalUrl({ type: 'personal' }, '/account/billing');
    } catch (error) {
      console.error('Failed to create personal Billing Portal session.', error);
    }
  }
  redirect(destination);
}
