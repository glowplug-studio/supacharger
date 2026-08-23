export const instant = false;

import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';

import { getSafeNextPath } from '@/supacharger/auth/safe-next-path';
import { OrganisationChooser } from '@/supacharger/organisations/organisation-chooser';
import { loadOrganisationList } from '@/supacharger/organisations/organisation-service';
import { SC_CONFIG } from '@/supacharger/supacharger-config';

export default async function OrganisationChooserPage({ searchParams }: {
  searchParams: Promise<{ invite?: string; next?: string }>;
}) {
  if (!SC_CONFIG.ORGANISATIONS.ENABLED) notFound();
  const [query, list, t] = await Promise.all([
    searchParams,
    loadOrganisationList(),
    getTranslations('Organisations'),
  ]);

  return (
    <section className='space-y-6' data-sc-organisation-page>
      <header>
        <h2 className='text-2xl font-semibold tracking-tight'>{t('chooser.title')}</h2>
        <p className='text-muted-foreground mt-1 text-sm'>{t('chooser.description')}</p>
      </header>
      <OrganisationChooser
        initialOrganisations={list.organisations}
        inviteToken={typeof query.invite === 'string' ? query.invite : null}
        nextPath={getSafeNextPath(query.next)}
      />
    </section>
  );
}
