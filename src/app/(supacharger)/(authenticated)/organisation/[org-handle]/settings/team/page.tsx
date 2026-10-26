export const instant = false;

import { notFound } from 'next/navigation';

import { organisationTeamPageOverride } from '@/supacharger.adapters/organisations/pages';
import { organisationHandleSchema } from '@/supacharger/organisations/organisation-contract';
import { loadOrganisationDetails } from '@/supacharger/organisations/organisation-service';
import { OrganisationTeam } from '@/supacharger/organisations/organisation-team';

export default async function OrganisationTeamPage({ params }: { params: Promise<{ 'org-handle': string }> }) {
  const parsed = organisationHandleSchema.safeParse((await params)['org-handle']);
  if (!parsed.success) notFound();
  const organisation = await loadOrganisationDetails(parsed.data);
  if (organisationTeamPageOverride) {
    return await organisationTeamPageOverride({ organisation, teamTab: null });
  }
  return <OrganisationTeam initialOrganisation={organisation} />;
}
