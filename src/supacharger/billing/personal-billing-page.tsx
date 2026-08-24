import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';

import { requireAppAccess } from '@/supacharger/auth/server-access';
import { getBillingOverviewForSubject } from '@/supacharger/billing/billing-service';
import { Button } from '@/supacharger/components/primitives/button';
import { SC_CONFIG } from '@/supacharger/supacharger-config';

export async function PersonalBillingPage({ portalError = false }: { portalError?: boolean }) {
  if (!SC_CONFIG.BILLING.ACCOUNT_SUBJECTS.PERSONAL) notFound();
  await requireAppAccess();
  const t = await getTranslations('AccountPages.billing');
  const billingAccounts = await getBillingOverviewForSubject({ type: 'personal' });

  return (
    <section className='space-y-6' data-sc-personal-billing>
      <header>
        <h2 className='text-2xl font-semibold tracking-tight'>{t('title')}</h2>
        <p className='text-muted-foreground mt-1 text-sm'>{t('description')}</p>
      </header>
      {portalError ? <p className='text-destructive text-sm' role='alert'>{t('portalError')}</p> : null}
      {billingAccounts.length === 0 ? (
        <BillingCard title={t('noAccount')}>
          <p className='text-muted-foreground text-sm'>{t('createAccountHelp')}</p>
          <Button className='mt-5' size='sm' variant='secondary' asChild>
            <Link href='/account/billing/subscribe'>{t('startSubscription')}</Link>
          </Button>
        </BillingCard>
      ) : billingAccounts.map((account) => (
        <BillingCard key={account.id} title={account.display_name || t('personalAccountTitle')}>
          {account.subscriptions.length === 0 ? (
            <div>
              <p className='text-muted-foreground text-sm'>{t('noSubscriptions')}</p>
              <Button className='mt-5' size='sm' variant='secondary' asChild>
                <Link href='/account/billing/subscribe'>{t('startSubscription')}</Link>
              </Button>
            </div>
          ) : (
            <div className='space-y-4'>
              {account.subscriptions.map((subscription) => (
                <div className='border-border rounded-lg border p-4' key={subscription.id}>
                  <p className='font-medium'>{t('status', { status: subscription.status ?? t('unknownStatus') })}</p>
                  <ul className='text-muted-foreground mt-2 space-y-1 text-sm'>
                    {subscription.items.map((item) => (
                      <li key={item.id}>{item.price.product?.name || item.price.id} × {item.quantity ?? 1}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
          {account.entitlements.length > 0 ? (
            <p className='text-muted-foreground mt-4 text-sm'>
              {t('features')}: {account.entitlements.map((item) => item.feature_lookup_key).join(', ')}
            </p>
          ) : null}
          <form action='/account/billing/portal' className='mt-5' method='post'>
            <input name='subjectType' type='hidden' value='personal' />
            <Button size='sm' type='submit' variant='secondary'>{t('manageBilling')}</Button>
          </form>
        </BillingCard>
      ))}
    </section>
  );
}

function BillingCard({ children, title }: { children: React.ReactNode; title: string }) {
  return (
    <article className='border-border bg-card rounded-xl border p-5 shadow-sm sm:p-6'>
      <h3 className='text-lg font-semibold'>{title}</h3>
      <div className='mt-4'>{children}</div>
    </article>
  );
}
