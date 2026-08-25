'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';

import { organisationSettingsNavigationExtensions } from '@/supacharger.adapters/organisations/navigation';
import { SC_CONFIG } from '@/supacharger/supacharger-config';

import type { OrganisationSummary } from './organisation-contract';
import { organisationSettingsPath } from './organisation-routes';
import { validateOrganisationSettingsExtensionIds } from './organisation-settings-contract';

export function OrganisationSettingsShell({
  children,
  organisation,
}: {
  children: React.ReactNode;
  organisation: OrganisationSummary;
}) {
  const pathname = usePathname();
  const t = useTranslations('Organisations');
  validateOrganisationSettingsExtensionIds(
    organisationSettingsNavigationExtensions,
    'organisationSettingsNavigationExtensions',
  );
  const items = [
    { href: organisationSettingsPath(organisation.handle), label: t('navigation.profile'), order: 10 },
    { href: organisationSettingsPath(organisation.handle, 'team'), label: t('navigation.team'), order: 20 },
    ...(SC_CONFIG.BILLING.ACCOUNT_SUBJECTS.ORGANISATION
      ? [{ href: organisationSettingsPath(organisation.handle, 'billing'), label: t('navigation.billing'), order: 30 }]
      : []),
    ...organisationSettingsNavigationExtensions.map((extension) => ({
      href: organisationSettingsPath(organisation.handle, extension.id),
      label: extension.label,
      order: extension.order,
    })),
  ].sort((left, right) => left.order - right.order);

  return (
    <main className='sc-organisation-settings' data-sc-organisation-settings>
      <header className='sc-organisation-settings__header'>
        <Link className='sc-organisation-settings__back' href={SC_CONFIG.ORGANISATIONS.CHOOSER_PATH}>
          {t('navigation.back')}
        </Link>
        <div className='sc-organisation-settings__identity'>
          <div className='sc-organisation-settings__title-group'>
            <h1 className='sc-organisation-settings__title'>{organisation.name}</h1>
            <p className='sc-organisation-settings__meta'>
              /{organisation.handle} · {t(`roles.${organisation.role}`)}
            </p>
          </div>
          {organisation.is_active ? (
            <span className='sc-organisation-settings__active'>{t('chooser.active')}</span>
          ) : null}
        </div>
      </header>
      <div className='sc-organisation-settings__layout'>
        <nav className='sc-organisation-settings__navigation' aria-label={t('navigation.label')}>
          <ul className='sc-organisation-settings__navigation-list'>
            {items.map((item) => {
              const active = item.href.endsWith('/settings') ? pathname === item.href : pathname.startsWith(item.href);
              return (
                <li className='sc-organisation-settings__navigation-item' key={item.href}>
                  <Link
                    aria-current={active ? 'page' : undefined}
                    className='sc-organisation-settings__navigation-link'
                    href={item.href}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        <div className='sc-organisation-settings__content'>{children}</div>
      </div>
    </main>
  );
}
