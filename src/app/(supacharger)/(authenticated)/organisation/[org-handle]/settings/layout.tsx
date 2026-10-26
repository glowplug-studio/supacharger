export const instant = false;

import { notFound } from 'next/navigation';

import { OrganisationSettingsChrome } from '@/supacharger.adapters/organisations/chrome';
import { organisationHandleSchema } from '@/supacharger/organisations/organisation-contract';
import { requireOrganisationDetails } from '@/supacharger/organisations/organisation-service';
import { OrganisationSettingsShell } from '@/supacharger/organisations/organisation-settings-shell';
import { SC_CONFIG } from '@/supacharger/supacharger-config';

export default async function Layout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ 'org-handle': string }>;
}) {
  if (!SC_CONFIG.ORGANISATIONS.ENABLED || SC_CONFIG.ORGANISATIONS.ROUTE_MODE !== 'organisation-handle') notFound();
  const parsed = organisationHandleSchema.safeParse((await params)['org-handle']);
  if (!parsed.success) notFound();
  const organisation = await requireOrganisationDetails(parsed.data);
  return (
    <OrganisationSettingsChrome>
      <OrganisationSettingsShell organisation={organisation}>{children}</OrganisationSettingsShell>
    </OrganisationSettingsChrome>
  );
}
