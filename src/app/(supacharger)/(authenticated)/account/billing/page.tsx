import { PropsWithChildren, ReactNode } from 'react';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';

import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/seperator';
import { getBillingOverview } from '@/features/account/controllers/get-billing-overview';

export default async function BillingPage() {
  const t = await getTranslations('AccountPages.billing');
  const billingAccounts = await getBillingOverview();

  return (
    <section className=''>
      <div className='container'>
        <section className='w-full'>
          <div>
            <h2 className='text-2xl font-bold tracking-tight'>{t('title')}</h2>
            <Separator className='my-4' />
          </div>

          <div className='container mx-auto space-y-6 px-4 py-8'>
            {billingAccounts.length === 0 ? (
              <Card
                title={t('noAccount')}
                footer={
                  <Button size='sm' variant='secondary' asChild>
                    <Link href='/account/billing/subscribe'>{t('startSubscription')}</Link>
                  </Button>
                }
              >
                <p>{t('createAccountHelp')}</p>
              </Card>
            ) : (
              billingAccounts.map((account) => (
                <Card
                  key={account.id}
                  title={account.display_name || t('accountTitle', { type: account.subject_type })}
                  footer={
                    account.member_role !== 'member' ? (
                      <Button size='sm' variant='secondary' asChild>
                        <a href={`billing/portal?billing_account_id=${account.id}`}>{t('manageBilling')}</a>
                      </Button>
                    ) : undefined
                  }
                >
                  {account.subscriptions.length === 0 ? (
                    <p>{t('noSubscriptions')}</p>
                  ) : (
                    <div className='space-y-4'>
                      {account.subscriptions.map((subscription) => (
                        <div key={subscription.id} className='rounded border border-zinc-800 p-3'>
                          <p className='font-medium'>{t('status', { status: subscription.status ?? t('unknownStatus') })}</p>
                          <ul className='mt-2 space-y-1 text-sm text-zinc-300'>
                            {subscription.items.map((item) => (
                              <li key={item.id}>
                                {item.price.product?.name || item.price.id} × {item.quantity ?? 1}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  )}
                  {account.entitlements.length > 0 && (
                    <p className='mt-4 text-sm text-zinc-400'>
                      {t('features')}: {account.entitlements.map((item) => item.feature_lookup_key).join(', ')}
                    </p>
                  )}
                </Card>
              ))
            )}
          </div>
        </section>
      </div>
    </section>
  );
}

function Card({
  title,
  footer,
  children,
}: PropsWithChildren<{
  title: string;
  footer?: ReactNode;
}>) {
  return (
    <div className='w-full max-w-3xl rounded-md bg-zinc-900'>
      <div className='p-4'>
        <h2 className='mb-1 text-xl font-semibold'>{title}</h2>
        <div className='py-4'>{children}</div>
      </div>
      <div className='flex justify-end rounded-b-md border-t border-zinc-800 p-4'>{footer}</div>
    </div>
  );
}
