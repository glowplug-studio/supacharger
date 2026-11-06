'use client';

import { Suspense, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Bell, Building2, CreditCard, IdCard, LockKeyhole, ShieldCheck, UserRound } from 'lucide-react';

import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { resolveAccountNavigation } from '@/supacharger.adapters/account/navigation';
import type { AccountNavigationIconName, AccountNavigationItem } from '@/supacharger/account/settings/account-settings-contract';
import { SC_CONFIG } from '@/supacharger/supacharger-config';

const navigationIcons = {
  profile: UserRound,
  security: ShieldCheck,
  privacy: LockKeyhole,
  notifications: Bell,
  billing: CreditCard,
  organisations: Building2,
  product: IdCard,
} satisfies Record<AccountNavigationIconName, typeof UserRound>;

function AccountContentLoading({ label }: { label: string }) {
  return (
    <div aria-busy='true' aria-label={label} className='flex min-h-64 items-center justify-center'>
      <LoadingSpinner className='h-8 w-32 text-muted-foreground' />
    </div>
  );
}

export function AccountSettingsShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const t = useTranslations('AccountSettings');
  const navigationListRef = useRef<HTMLUListElement>(null);
  const baseItems: AccountNavigationItem[] = [
    { id: 'details', href: '/account', label: t('navigation.details'), order: 10, icon: 'profile' },
    { id: 'security', href: '/account/security', label: t('navigation.security'), order: 20, icon: 'security' },
    { id: 'privacy', href: '/account/privacy', label: t('navigation.privacy'), order: 30, icon: 'privacy' },
    { id: 'notifications', href: '/account/notifications', label: t('navigation.notifications'), order: 40, icon: 'notifications' },
    ...(SC_CONFIG.BILLING.ACCOUNT_SUBJECTS.PERSONAL
      ? [{ id: 'billing', href: '/account/billing', label: t('navigation.billing'), order: 50, icon: 'billing' as const }]
      : []),
    ...(SC_CONFIG.ORGANISATIONS.ENABLED
      ? [{ id: 'organisations', href: SC_CONFIG.ORGANISATIONS.CHOOSER_PATH, label: t('navigation.organisations'), order: 60, icon: 'organisations' as const }]
      : []),
    ...(SC_CONFIG.ACCOUNT_SETTINGS.PRODUCT_PROFILE_PATH
      ? [{ id: 'product-profile', href: SC_CONFIG.ACCOUNT_SETTINGS.PRODUCT_PROFILE_PATH, label: t('navigation.productProfile'), order: 70, icon: 'product' as const }]
      : []),
  ];
  const navigationItems = resolveAccountNavigation(baseItems);

  useEffect(() => {
    navigationListRef.current?.querySelector<HTMLElement>('[aria-current="page"]')
      ?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }, [pathname]);

  return (
    <main className='sc-account-shell' data-sc-account-shell>
      <header className='sc-account-header' data-sc-account-header>
        <h1 className='sc-account-title'>{t('title')}</h1>
        <p className='sc-account-description'>{t('description')}</p>
      </header>
      <div className='sc-account-layout'>
        <nav aria-label={t('navigation.label')} className='sc-account-navigation' data-sc-account-navigation>
          <ul className='sc-account-navigation-list' ref={navigationListRef}>
            {navigationItems.map((item) => {
              const active = item.href === '/account' ? pathname === item.href : pathname.startsWith(item.href);
              const Icon = item.icon ? navigationIcons[item.icon] : null;
              return (
                <li className='sc-account-navigation-item' key={item.id}>
                  <Link aria-current={active ? 'page' : undefined} className='sc-account-navigation-link' data-active={active ? 'true' : 'false'} href={item.href}>
                    {Icon ? <Icon aria-hidden='true' className='sc-account-navigation-icon' /> : null}
                    <span className='sc-account-navigation-label'>{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        <div className='sc-account-content'>
          <Suspense fallback={<AccountContentLoading label={t('title')} />}>{children}</Suspense>
        </div>
      </div>
    </main>
  );
}
