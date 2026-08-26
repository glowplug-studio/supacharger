import { notFound } from 'next/navigation';

import { AgentConnectionsPanel } from '@/supacharger/agents/agent-connections-panel';
import { SC_CONFIG } from '@/supacharger/supacharger-config';

export const instant = false;

export default function AccountAgentsPage() {
  if (!SC_CONFIG.AGENT_CONNECTIONS.ENABLED) notFound();
  return <AgentConnectionsPanel scope='mine' />;
}
