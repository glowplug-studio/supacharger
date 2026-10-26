export const instant = false;

import { notFound } from 'next/navigation';

import { organisationTeamPageOverride } from '@/supacharger.adapters/organisations/pages';
import { organisationHandleSchema } from '@/supacharger/organisations/organisation-contract';
import { loadOrganisationDetails } from '@/supacharger/organisations/organisation-service';

export default async function OrganisationTeamTabPage({
  params,
}: {
  params: Promise<{ 'org-handle': string; teamTab: string }>;
}) {
  if (!organisationTeamPageOverride) notFound();
  const query = await params;
  const parsed = organisationHandleSchema.safeParse(query['org-handle']);
  if (!parsed.success) notFound();
  const organisation = await loadOrganisationDetails(parsed.data);
  return await organisationTeamPageOverride({ organisation, teamTab: query.teamTab });
}
