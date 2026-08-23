'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';

import { SC_CONFIG } from '@/supacharger/supacharger-config';
import { cn } from '@/utils/cn';

import type { OrganisationSummary } from './organisation-contract';
import { organisationSettingsPath } from './organisation-routes';

export function OrganisationSettingsShell({ children, organisation }: {
  children: React.ReactNode;
  organisation: OrganisationSummary;
}) {
  const pathname = usePathname();
  const t = useTranslations('Organisations');
  const items = [
    { href: organisationSettingsPath(organisation.handle), label: t('navigation.profile') },
    { href: organisationSettingsPath(organisation.handle, 'team'), label: t('navigation.team') },
    ...(SC_CONFIG.BILLING.ACCOUNT_SUBJECTS.ORGANISATION
      ? [{ href: organisationSettingsPath(organisation.handle, 'billing'), label: t('navigation.billing') }]
      : []),
  ];

  return (
    <main className='mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8' data-sc-organisation-settings>
      <header className='mb-8'>
        <Link className='text-muted-foreground hover:text-foreground text-sm' href={SC_CONFIG.ORGANISATIONS.CHOOSER_PATH}>{t('navigation.back')}</Link>
        <div className='mt-3 flex flex-wrap items-end justify-between gap-3'>
          <div>
            <h1 className='text-3xl font-semibold tracking-tight'>{organisation.name}</h1>
            <p className='text-muted-foreground mt-1 text-sm'>/{organisation.handle} · {t(`roles.${organisation.role}`)}</p>
          </div>
          {organisation.is_active ? <span className='bg-primary/10 text-primary rounded-full px-3 py-1 text-xs'>{t('chooser.active')}</span> : null}
        </div>
      </header>
      <div className='grid gap-8 md:grid-cols-[13rem_minmax(0,1fr)]'>
        <nav aria-label={t('navigation.label')}>
          <ul className='flex gap-2 overflow-x-auto pb-2 md:flex-col md:overflow-visible'>
            {items.map((item) => {
              const active = item.href.endsWith('/settings') ? pathname === item.href : pathname.startsWith(item.href);
              return (
                <li key={item.href}>
                  <Link
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'focus-visible:ring-ring block min-h-10 whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium focus-visible:ring-2 focus-visible:outline-none',
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
