'use client';

import { useEffect } from 'react';

import type { AgentConsentExtensionProps } from '@/supacharger/agents/agent-connection-contract';

/** Product-owned consent fields. Core remains valid with no product resource binding. */
export function AgentConsentExtension({ onChange }: AgentConsentExtensionProps) {
  useEffect(() => {
    onChange({ payload: {}, valid: true });
  }, [onChange]);
  return null;
}
