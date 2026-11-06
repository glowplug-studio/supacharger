import Link from 'next/link';
import { getTranslations } from 'next-intl/server';

import { Button } from '@/supacharger/components/primitives/button';

const tabs = [
  { href: '/account/billing', id: 'overview', label: 'overviewTab' },
  { href: '/account/billing/invoices', id: 'invoices', label: 'invoicesTab' },
  { href: '/account/billing/upgrade', id: 'upgrade', label: 'upgradeTab' },
] as const;

export async function BillingTabs({ active }: { active: (typeof tabs)[number]['id'] }) {
  const t = await getTranslations('AccountPages.billing');
  return (
    <nav aria-label={t('sectionsLabel')} className='flex flex-wrap gap-2'>
      {tabs.map((tab) => (
        <Button key={tab.id} size='sm' variant={active === tab.id ? 'default' : 'secondary'} asChild>
          <Link href={tab.href}>{t(tab.label)}</Link>
        </Button>
      ))}
    </nav>
  );
}
