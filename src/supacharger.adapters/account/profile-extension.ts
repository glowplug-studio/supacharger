import { z } from 'zod';

export const accountProfileExtensionSchema = z.object({}).strict();

export async function loadAccountProfileExtension(_userId: string): Promise<Record<string, unknown>> {
  return {};
}

export async function updateAccountProfileExtension(
  _userId: string,
  _values: Record<string, unknown>,
): Promise<void> {}
