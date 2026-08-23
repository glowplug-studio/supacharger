import { redirect } from 'next/navigation';

import { createClient } from '@/lib/supabase/server';
import type { Json } from '@/lib/supabase/types';
import { loadOrganisationProfileExtension } from '@/supacharger.adapters/organisations/profile-extension';
import { SC_CONFIG } from '@/supacharger/supacharger-config';

import {
  type OrganisationAction,
  organisationActionSchema,
  organisationDetailsSchema,
  organisationListSchema,
} from './organisation-contract';

import 'server-only';

export async function runOrganisationAction(actionInput: OrganisationAction) {
  if (!SC_CONFIG.ORGANISATIONS.ENABLED) throw new Error('Organisations are disabled.');
  const action = organisationActionSchema.parse(actionInput);
  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user || user.is_anonymous || !user.email_confirmed_at) {
    throw new Error('A verified account is required.');
  }

  const rpcPayload = action.action === 'update'
    ? Object.fromEntries(Object.entries(action).filter(([key]) => key !== 'extension'))
    : action;
  const { data, error } = await supabase.schema('api').rpc('organisations', { input_payload: rpcPayload as Json });
  if (error) throw error;

  const result = (data ?? {}) as Record<string, unknown>;
  if (result.requiresSessionRefresh) {
    const { error: refreshError } = await supabase.auth.refreshSession();
    if (refreshError) throw refreshError;
  }
  return { actorUserId: user.id, result };
}

export async function loadOrganisationList() {
  const { result } = await runOrganisationAction({ action: 'list' });
  return organisationListSchema.parse(result);
}

export async function loadOrganisationDetails(handle: string) {
  const { result } = await runOrganisationAction({ action: 'read', handle });
  return organisationDetailsSchema.parse(result);
}

export async function loadOrganisationProfile(handle: string) {
  const details = await loadOrganisationDetails(handle);
  const extension = await loadOrganisationProfileExtension(details.id);
  return { details, extension };
}

export async function requireOrganisationDetails(handle: string) {
  try {
    return await loadOrganisationDetails(handle);
  } catch {
    redirect(SC_CONFIG.ORGANISATIONS.CHOOSER_PATH);
  }
}
