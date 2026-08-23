'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';

import { accountNavigationExtensions } from '@/supacharger.adapters/account/navigation';
import { SC_CONFIG } from '@/supacharger/supacharger-config';
import { cn } from '@/utils/cn';

export function AccountSettingsShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const t = useTranslations('AccountSettings');
  const baseItems = [
    { id: 'details', href: '/account', label: t('navigation.details'), order: 10 },
    { id: 'security', href: '/account/security', label: t('navigation.security'), order: 20 },
    ...(SC_CONFIG.BILLING.ACCOUNT_SUBJECTS.PERSONAL
      ? [{ id: 'billing', href: '/account/billing', label: t('navigation.billing'), order: 30 }]
      : []),
    ...(SC_CONFIG.ORGANISATIONS.ENABLED
      ? [
          {
            id: 'organisations',
            href: SC_CONFIG.ORGANISATIONS.CHOOSER_PATH,
            label: t('navigation.organisations'),
            order: 40,
          },
        ]
      : []),
    ...(SC_CONFIG.ACCOUNT_SETTINGS.PRODUCT_PROFILE_PATH
      ? [
          {
            id: 'product-profile',
            href: SC_CONFIG.ACCOUNT_SETTINGS.PRODUCT_PROFILE_PATH,
            label: t('navigation.productProfile'),
            order: 50,
          },
        ]
      : []),
    ...accountNavigationExtensions,
  ].sort((left, right) => left.order - right.order);

  return (
    <main className='mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8' data-sc-account-shell>
      <header className='mb-8 space-y-2' data-sc-account-header>
        <h1 className='text-3xl font-semibold tracking-tight'>{t('title')}</h1>
        <p className='text-muted-foreground max-w-2xl text-sm sm:text-base'>{t('description')}</p>
      </header>
      <div className='grid gap-8 md:grid-cols-[13rem_minmax(0,1fr)]'>
        <nav aria-label={t('navigation.label')} className='min-w-0' data-sc-account-navigation>
          <ul className='flex gap-2 overflow-x-auto pb-2 md:flex-col md:overflow-visible'>
            {baseItems.map((item) => {
              const active = item.href === '/account' ? pathname === item.href : pathname.startsWith(item.href);
              return (
                <li key={item.id}>
                  <Link
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'focus-visible:ring-ring block min-h-10 whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none',
                      active ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                    )}
                    href={item.href}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        <div className='min-w-0'>{children}</div>
      </div>
    </main>
  );
}
