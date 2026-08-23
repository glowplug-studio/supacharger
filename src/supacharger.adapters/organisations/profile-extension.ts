import { z } from 'zod';

export const organisationProfileExtensionSchema = z.object({}).strict();

export async function loadOrganisationProfileExtension(_organisationId: string): Promise<Record<string, unknown>> {
  return {};
}

export async function updateOrganisationProfileExtension(_input: {
  actorUserId: string;
  organisationId: string;
  values: Record<string, unknown>;
}): Promise<void> {}
