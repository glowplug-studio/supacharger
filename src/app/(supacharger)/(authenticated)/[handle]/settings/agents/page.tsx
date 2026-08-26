import { notFound } from 'next/navigation';

import { AgentConnectionsPanel } from '@/supacharger/agents/agent-connections-panel';
import { organisationHandleSchema } from '@/supacharger/organisations/organisation-contract';
import { loadOrganisationDetails } from '@/supacharger/organisations/organisation-service';
import { SC_CONFIG } from '@/supacharger/supacharger-config';

export const instant = false;

export default async function OrganisationAgentsPage({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  if (!SC_CONFIG.AGENT_CONNECTIONS.ENABLED || !SC_CONFIG.ORGANISATIONS.ENABLED) notFound();
  const parsed = organisationHandleSchema.safeParse((await params).handle);
  if (!parsed.success) notFound();
  const organisation = await loadOrganisationDetails(parsed.data);
  return <AgentConnectionsPanel organisationId={organisation.id} scope='organisation' />;
}
