export const instant = false;

import { notFound } from 'next/navigation';

import { organisationSettingsSectionExtensions } from '@/supacharger.adapters/organisations/pages';
import { organisationHandleSchema } from '@/supacharger/organisations/organisation-contract';
import { loadOrganisationDetails } from '@/supacharger/organisations/organisation-service';
import { validateOrganisationSettingsExtensionIds } from '@/supacharger/organisations/organisation-settings-contract';

export default async function OrganisationExtensionPage({
  params,
}: {
  params: Promise<{ handle: string; section: string }>;
}) {
  validateOrganisationSettingsExtensionIds(
    organisationSettingsSectionExtensions,
    'organisationSettingsSectionExtensions',
  );
  const query = await params;
  const parsed = organisationHandleSchema.safeParse(query.handle);
  const extension = organisationSettingsSectionExtensions.find((item) => item.id === query.section);
  if (!parsed.success || !extension) notFound();
  const organisation = await loadOrganisationDetails(parsed.data);
  return await extension.render({ organisation });
}
