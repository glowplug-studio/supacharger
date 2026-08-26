import { notFound } from 'next/navigation';

import { AgentOAuthConsent } from '@/supacharger/agents/agent-oauth-consent';
import { SC_CONFIG } from '@/supacharger/supacharger-config';

export const instant = false;

export default async function AgentOAuthConsentPage({
  searchParams,
}: {
  searchParams: Promise<{ authorization_id?: string }>;
}) {
  if (!SC_CONFIG.AGENT_CONNECTIONS.ENABLED) notFound();
  return <AgentOAuthConsent authorizationId={(await searchParams).authorization_id ?? ''} />;
}
