import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';

import { getBillingOverviewForSubject } from '@/supacharger/billing/billing-service';
import { Button } from '@/supacharger/components/primitives/button';
import { SC_CONFIG } from '@/supacharger/supacharger-config';

import type { OrganisationDetails } from './organisation-contract';

export async function OrganisationBillingPage({
  organisation,
  portalError,
}: {
  organisation: OrganisationDetails;
  portalError: boolean;
}) {
  if (!SC_CONFIG.BILLING.ACCOUNT_SUBJECTS.ORGANISATION) notFound();
  const t = await getTranslations('Organisations');
  const canManage = organisation.role === 'owner' || organisation.role === 'admin';
  const accounts = await getBillingOverviewForSubject({ type: 'organisation', organisationId: organisation.id });

  return (
    <section className='sc-organisation-billing' data-sc-organisation-billing>
      <header className='sc-organisation-page-header'>
        <h2 className='sc-organisation-page-title'>{t('billing.title')}</h2>
        <p className='sc-organisation-page-description'>{t('billing.description')}</p>
      </header>
      {portalError ? (
        <p className='sc-organisation-status' data-kind='error' role='alert'>
          {t('billing.portalError')}
        </p>
      ) : null}
      {accounts.length === 0 ? (
        <div className='sc-organisation-panel'>
          <h3 className='sc-organisation-panel-title'>{t('billing.noAccount')}</h3>
          <p className='sc-organisation-panel-description'>{t('billing.noAccountHelp')}</p>
        </div>
      ) : (
        accounts.map((account) => (
          <article className='sc-organisation-panel sc-organisation-billing-account' key={account.id}>
            <h3 className='sc-organisation-panel-title'>{account.display_name || organisation.name}</h3>
            {account.subscriptions.length === 0 ? (
              <p className='sc-organisation-empty-description'>{t('billing.noSubscriptions')}</p>
            ) : (
              <ul className='sc-organisation-subscription-list'>
                {account.subscriptions.map((subscription) => (
                  <li className='sc-organisation-subscription' key={subscription.id}>
                    <p className='sc-organisation-subscription-title'>
                      {t('billing.status', { status: subscription.status || t('billing.unknown') })}
                    </p>
                    <p className='sc-organisation-subscription-description'>
                      {subscription.items
                        .map((item) => `${item.price.product?.name || item.price.id} × ${item.quantity ?? 1}`)
                        .join(', ')}
                    </p>
                  </li>
                ))}
              </ul>
            )}
            {canManage ? (
              <form
                action={`/organisation/${encodeURIComponent(organisation.handle)}/settings/billing/portal`}
                className='sc-organisation-billing-action'
                method='post'
              >
                <Button size='sm' type='submit' variant='secondary'>
                  {t('billing.manage')}
                </Button>
              </form>
            ) : (
              <p className='sc-organisation-panel-description'>{t('billing.managerOnly')}</p>
            )}
          </article>
        ))
      )}
    </section>
  );
}
