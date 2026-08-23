import { redirect } from 'next/navigation';
import { connection } from 'next/server';

import { createBillingPortalUrl } from '@/supacharger/billing/billing-service';
import { organisationHandleSchema } from '@/supacharger/organisations/organisation-contract';
import { loadOrganisationDetails } from '@/supacharger/organisations/organisation-service';

export async function POST(_request: Request, { params }: { params: Promise<{ handle: string }> }) {
  await connection();
  const parsed = organisationHandleSchema.safeParse((await params).handle);
  if (!parsed.success) redirect('/account/organisation');
  const organisation = await loadOrganisationDetails(parsed.data);
  const returnPath = `/${encodeURIComponent(organisation.handle)}/settings/billing`;
  let destination = `${returnPath}?portal=error`;
  try {
    destination = await createBillingPortalUrl({ type: 'organisation', organisationId: organisation.id }, returnPath);
  } catch (error) {
    console.error('Failed to create organisation Billing Portal session.', error);
  }
  redirect(destination);
}
