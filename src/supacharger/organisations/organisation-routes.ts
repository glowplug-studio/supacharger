import { organisationHandleSchema } from './organisation-contract';

const organisationSettingsSectionPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function organisationSettingsPath(handleInput: string, section?: string) {
  const handle = organisationHandleSchema.parse(handleInput);
  if (section && !organisationSettingsSectionPattern.test(section)) {
    throw new Error(`Invalid organisation settings section: ${section}`);
  }
  return `/${encodeURIComponent(handle)}/settings${section ? `/${section}` : ''}`;
}
