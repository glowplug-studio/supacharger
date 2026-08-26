import type { Json } from '@/lib/supabase/types';
import type { SupabaseClient } from '@supabase/supabase-js';

import {
  agentConnectionListSchema,
  createdAgentConnectionSchema,
} from './agent-connection-contract';

export async function listAgentConnections(
  supabase: SupabaseClient,
  input: { scope: 'mine' } | { scope: 'organisation'; organisationId: string },
) {
  const { data, error } = await supabase.schema('api').rpc('agent_connections', {
    input_payload: { action: 'list', ...input } as Json,
  });
  if (error) throw error;
  return agentConnectionListSchema.parse(data);
}

export async function createAgentConnection(
  supabase: SupabaseClient,
  input: {
    extension: Record<string, unknown>;
    oauthClientId: string;
    oauthClientName: string;
    oauthScopes: string[];
    organisationId: string;
  },
) {
  const { data, error } = await supabase.schema('api').rpc('agent_connections', {
    input_payload: { action: 'create', ...input } as Json,
  });
  if (error) throw error;
  return createdAgentConnectionSchema.parse(data);
}

export async function mutateAgentConnection(
  supabase: SupabaseClient,
  action: 'revoke' | 'delete',
  agentConnectionId: string,
) {
  const { data, error } = await supabase.schema('api').rpc('agent_connections', {
    input_payload: { action, agentConnectionId } as Json,
  });
  if (error) throw error;
  return data;
}
