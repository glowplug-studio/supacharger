import { getTranslations } from 'next-intl/server';

import { requireOnboardedUser } from '@/supacharger/auth/server-access';
import { getPaidBillingInvoicesForSubject } from '@/supacharger/billing/billing-service';
import { BillingTabs } from '@/supacharger/billing/billing-tabs';
import { Button } from '@/supacharger/components/primitives/button';

function formatPaidAt(value: Date) {
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    hour: '2-digit',
    hour12: true,
    minute: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(value).replace(/\b(am|pm)\b/gi, (period) => period.toUpperCase());
}

export async function PersonalInvoicesPage() {
  await requireOnboardedUser();
  const t = await getTranslations('AccountPages.billing');
  const invoices = await getPaidBillingInvoicesForSubject({ type: 'personal' });

  return (
    <section className='space-y-6' data-sc-personal-invoices>
      <BillingTabs active='invoices' />
      <header>
        <h2 className='text-2xl font-semibold tracking-tight'>{t('invoicesTitle')}</h2>
        <p className='text-muted-foreground mt-1 text-sm'>{t('invoicesDescription')}</p>
      </header>
      {invoices.length === 0 ? <p className='text-muted-foreground text-sm'>{t('noInvoices')}</p> : (
        <div className='space-y-3'>
          {invoices.map((invoice) => (
            <article className='border-border bg-card flex flex-wrap items-center justify-between gap-4 rounded-xl border p-5' key={invoice.id}>
              <div>
                <h3 className='font-medium'>{invoice.number ?? invoice.id}</h3>
                <p className='text-muted-foreground mt-1 text-sm'>
                  {new Intl.NumberFormat('en-GB', { currency: invoice.currency.toUpperCase(), style: 'currency' }).format(invoice.amountPaid / 100)}
                  {invoice.paidAt ? ` · ${formatPaidAt(invoice.paidAt)}` : null}
                </p>
              </div>
              <div className='flex gap-2'>
                {invoice.hostedInvoiceUrl ? <Button size='sm' variant='secondary' asChild><a href={invoice.hostedInvoiceUrl} rel='noopener noreferrer' target='_blank'>{t('viewInvoice')}</a></Button> : null}
                {invoice.invoicePdf ? <Button size='sm' variant='secondary' asChild><a href={invoice.invoicePdf} rel='noopener noreferrer' target='_blank'>{t('downloadInvoice')}</a></Button> : null}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
