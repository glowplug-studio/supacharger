export const instant = false;

import { notFound } from 'next/navigation';

import { organisationBillingPageOverride } from '@/supacharger.adapters/organisations/pages';
import { OrganisationBillingPage } from '@/supacharger/organisations/organisation-billing-page';
import { organisationHandleSchema } from '@/supacharger/organisations/organisation-contract';
import { loadOrganisationDetails } from '@/supacharger/organisations/organisation-service';

export default async function BillingPage({
  params,
  searchParams,
}: {
  params: Promise<{ 'org-handle': string }>;
  searchParams: Promise<{ portal?: string }>;
}) {
  const parsed = organisationHandleSchema.safeParse((await params)['org-handle']);
  if (!parsed.success) notFound();
  const [organisation, query] = await Promise.all([loadOrganisationDetails(parsed.data), searchParams]);
  if (organisationBillingPageOverride) {
    return await organisationBillingPageOverride({ organisation, portalError: query.portal === 'error' });
  }
  return <OrganisationBillingPage organisation={organisation} portalError={query.portal === 'error'} />;
}
