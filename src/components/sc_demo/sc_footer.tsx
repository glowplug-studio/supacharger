import Link from 'next/link';
import { getTranslations } from 'next-intl/server';

import { SupachargerAttribution } from '@/components/sc_widgets/attribution/supacharger-attribution';
import ModeToggle from '@/supacharger/components/buttons/mode-toggle-button';
import { SC_CONFIG } from '@/supacharger/supacharger-config';

import LocaleSwitcher from './sc_locale-switcher';
import SCSiteLogo from './sc_site-logo';

export default async function SCFooter() {
  const t = await getTranslations('MarketingFooter');
  const footerGroups = [
    {
      label: t('navigation'),
      links: [
        { href: '/#overview', label: t('overview') },
        { href: '/#features', label: t('features') },
        { href: '/#integrations', label: t('integrations') },
        { href: '/#benefits', label: t('benefits') },
        { href: '/#reviews', label: t('reviews') },
        { href: '/#pricing', label: t('pricing') },
      ],
    },
    {
      label: t('information'),
      links: [
        { href: '/#faq', label: t('faq') },
        { href: '/legal', label: t('termsOfUse') },
        { href: '/license', label: t('license') },
        { href: '/account/login', label: t('login') },
        { href: '/account/create', label: t('createAccount') },
      ],
    },
  ];
  return (
    <footer className='border-border bg-card text-foreground border-t'>
      <div className='mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8'>
        <div className='grid gap-12 lg:grid-cols-[1.35fr_2fr] lg:gap-20'>
          <div className='max-w-sm'>
            <SCSiteLogo showSiteTitle={true} />
            <p className='text-muted-foreground mt-6 text-sm leading-6'>{t('tagline')}</p>
            <div className='mt-8 flex flex-wrap items-center gap-2'>
              <LocaleSwitcher appearance='marketing' />
              <ModeToggle appearance='marketing' />
            </div>
          </div>

          <div className='grid grid-cols-2 gap-10'>
            {footerGroups.map((group) => (
              <div key={group.label}>
                <h2 className='text-foreground text-sm font-medium'>{group.label}</h2>
                <ul className='mt-5 space-y-3' role='list'>
                  {group.links.map((link) => (
                    <li key={link.label}>
                      <Link
                        className='text-muted-foreground hover:text-foreground text-sm transition-colors'
                        href={link.href}
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className='border-border text-muted-foreground mt-16 grid gap-3 border-t pt-7 text-sm sm:grid-cols-3 sm:items-center'>
          <p>
            © {new Date().getFullYear()} {SC_CONFIG.SITE_TITLE}. {t('allRightsReserved')}
          </p>
          <p className='text-center'>
            {t('firstBuiltIn')}{' '}
            <a
              className='hover:text-foreground transition-colors'
              href='https://en.wikipedia.org/wiki/Koru'
              rel='noopener noreferrer'
              target='_blank'
            >
              🇳🇿{t('newZealand')}
            </a>
            <br />
            {t('by')}{' '}
            <a
              className='hover:text-foreground transition-colors'
              href='https://bio.glowplug.link'
              rel='noopener noreferrer'
              target='_blank'
            >
              @remoteproductdev
            </a>{' '}
            -{' '}
            <a
              className='hover:text-foreground transition-colors'
              href='https://glowplug.studio'
              rel='noopener noreferrer'
              target='_blank'
            >
              Glowplug
            </a>
          </p>
          <div className='sm:justify-self-end'>
            <SupachargerAttribution />
          </div>
        </div>
      </div>
    </footer>
  );
}
