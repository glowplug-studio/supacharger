export const instant = false;

import { notFound } from 'next/navigation';

import { organisationHandleSchema } from '@/supacharger/organisations/organisation-contract';
import { loadOrganisationDetails } from '@/supacharger/organisations/organisation-service';
import { OrganisationTeam } from '@/supacharger/organisations/organisation-team';

export default async function OrganisationTeamPage({ params }: { params: Promise<{ handle: string }> }) {
  const parsed = organisationHandleSchema.safeParse((await params).handle);
  if (!parsed.success) notFound();
  return <OrganisationTeam initialOrganisation={await loadOrganisationDetails(parsed.data)} />;
}
