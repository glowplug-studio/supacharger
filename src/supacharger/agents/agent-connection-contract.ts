import { z } from 'zod';

export const agentConsentExtensionStateSchema = z.object({
  payload: z.record(z.string(), z.unknown()),
  valid: z.boolean(),
});

export type AgentConsentExtensionState = z.infer<typeof agentConsentExtensionStateSchema>;

export type AgentConsentExtensionProps = {
  disabled: boolean;
  organisationId: string;
  onChange: (state: AgentConsentExtensionState) => void;
};

export const agentConnectionSchema = z.object({
  agentConnectionId: z.string().uuid(),
  organisationId: z.string().uuid(),
  organisationName: z.string(),
  organisationHandle: z.string(),
  authorisedUserId: z.string().uuid(),
  authorisedFirstName: z.string().nullable(),
  authorisedLastName: z.string().nullable(),
  authorisedUsername: z.string().nullable(),
  oauthClientId: z.string(),
  oauthClientName: z.string(),
  oauthScopes: z.array(z.string()),
  createdAt: z.string(),
  lastUsedAt: z.string().nullable(),
  revokedAt: z.string().nullable(),
  isOwn: z.boolean(),
  extension: z.record(z.string(), z.unknown()),
});

export const agentConnectionListSchema = z.object({
  scope: z.enum(['mine', 'organisation']),
  canManageOrganisation: z.boolean(),
  connections: z.array(agentConnectionSchema),
});

export const createdAgentConnectionSchema = z.object({
  agentConnectionId: z.string().uuid(),
  organisationId: z.string().uuid(),
  oauthClientId: z.string(),
  oauthClientName: z.string(),
  oauthScopes: z.array(z.string()),
  createdAt: z.string(),
  extension: z.record(z.string(), z.unknown()),
});

export type AgentConnection = z.infer<typeof agentConnectionSchema>;
export type AgentConnectionList = z.infer<typeof agentConnectionListSchema>;
