import { organisationHandleSchema } from './organisation-contract';

export function organisationSettingsPath(handleInput: string, section?: 'billing' | 'team') {
  const handle = organisationHandleSchema.parse(handleInput);
  return `/${encodeURIComponent(handle)}/settings${section ? `/${section}` : ''}`;
}
