import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';

import { getBillingOverviewForSubject } from '@/supacharger/billing/billing-service';
import { Button } from '@/supacharger/components/primitives/button';
import { SC_CONFIG } from '@/supacharger/supacharger-config';

import type { OrganisationDetails } from './organisation-contract';

export async function OrganisationBillingPage({ organisation, portalError }: {
  organisation: OrganisationDetails;
  portalError: boolean;
}) {
  if (!SC_CONFIG.BILLING.ACCOUNT_SUBJECTS.ORGANISATION) notFound();
  const t = await getTranslations('Organisations');
  const canManage = organisation.role === 'owner' || organisation.role === 'admin';
  const accounts = await getBillingOverviewForSubject({ type: 'organisation', organisationId: organisation.id });

  return (
    <section className='space-y-6' data-sc-organisation-billing>
      <header><h2 className='text-2xl font-semibold tracking-tight'>{t('billing.title')}</h2><p className='text-muted-foreground mt-1 text-sm'>{t('billing.description')}</p></header>
      {portalError ? <p className='text-destructive text-sm' role='alert'>{t('billing.portalError')}</p> : null}
      {accounts.length === 0 ? (
        <div className='border-border bg-card rounded-xl border p-5 shadow-sm sm:p-6'><h3 className='font-semibold'>{t('billing.noAccount')}</h3><p className='text-muted-foreground mt-1 text-sm'>{t('billing.noAccountHelp')}</p></div>
      ) : accounts.map((account) => (
        <article className='border-border bg-card rounded-xl border p-5 shadow-sm sm:p-6' key={account.id}>
          <h3 className='text-lg font-semibold'>{account.display_name || organisation.name}</h3>
          {account.subscriptions.length === 0 ? <p className='text-muted-foreground mt-3 text-sm'>{t('billing.noSubscriptions')}</p> : (
            <ul className='mt-4 space-y-3'>{account.subscriptions.map((subscription) => <li className='border-border rounded-lg border p-4' key={subscription.id}><p className='font-medium'>{t('billing.status', { status: subscription.status || t('billing.unknown') })}</p><p className='text-muted-foreground mt-1 text-sm'>{subscription.items.map((item) => `${item.price.product?.name || item.price.id} × ${item.quantity ?? 1}`).join(', ')}</p></li>)}</ul>
          )}
          {canManage ? <form action={`/${encodeURIComponent(organisation.handle)}/settings/billing/portal`} className='mt-5' method='post'><Button size='sm' type='submit' variant='secondary'>{t('billing.manage')}</Button></form> : <p className='text-muted-foreground mt-4 text-sm'>{t('billing.managerOnly')}</p>}
        </article>
      ))}
    </section>
  );
}
