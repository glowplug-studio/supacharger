export const instant = false;

import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';

import { organisationChooserPageOverride } from '@/supacharger.adapters/organisations/pages';
import { getSafeNextPath } from '@/supacharger/auth/safe-next-path';
import { OrganisationChooser } from '@/supacharger/organisations/organisation-chooser';
import { loadOrganisationList } from '@/supacharger/organisations/organisation-service';
import type { OrganisationChooserSearchParams } from '@/supacharger/organisations/organisation-settings-contract';
import { SC_CONFIG } from '@/supacharger/supacharger-config';

export default async function OrganisationChooserPage({
  searchParams,
}: {
  searchParams: OrganisationChooserSearchParams;
}) {
  if (!SC_CONFIG.ORGANISATIONS.ENABLED) notFound();
  if (organisationChooserPageOverride) {
    return await organisationChooserPageOverride({ searchParams });
  }
  const [query, list, t] = await Promise.all([searchParams, loadOrganisationList(), getTranslations('Organisations')]);

  return (
    <section className='sc-organisation-page' data-sc-organisation-page>
      <header className='sc-organisation-page-header'>
        <h2 className='sc-organisation-page-title'>{t('chooser.title')}</h2>
        <p className='sc-organisation-page-description'>{t('chooser.description')}</p>
      </header>
      <OrganisationChooser
        initialOrganisations={list.organisations}
        inviteToken={typeof query.invite === 'string' ? query.invite : null}
        nextPath={getSafeNextPath(query.next)}
      />
    </section>
  );
}
