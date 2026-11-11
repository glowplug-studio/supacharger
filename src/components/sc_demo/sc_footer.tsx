import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { ArrowUp } from 'lucide-react';

import { SupachargerAttribution } from '@/components/sc_widgets/attribution/supacharger-attribution';
import { Button } from '@/components/ui/button';
import ModeToggle from '@/supacharger/components/buttons/mode-toggle-button';

import LocaleSwitcher from './sc_locale-switcher';
import SCSiteLogo from './sc_site-logo';

export default async function SCFooter() {
  const t = await getTranslations('MarketingFooter');
  const global = await getTranslations('Global');
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

        <div className='mt-12 flex justify-end'>
          <Button
            aria-label={t('backToTop')}
            asChild
            className='border-border text-foreground hover:bg-accent hover:text-foreground h-[46px] w-[46px] rounded-lg border bg-transparent px-0 py-3 shadow-none'
            variant='outline'
          >
            <a href='#hero'>
              <ArrowUp aria-hidden='true' />
            </a>
          </Button>
        </div>

        <div className='border-border text-muted-foreground mt-6 grid gap-3 border-t pt-7 text-sm sm:grid-cols-3 sm:items-start'>
          <div>
            <p className='leading-6'>
              <span className='block'>
                {global('siteTitle')} Supacharger. {t('allRightsReserved')}
              </span>
              <span className='block'>
                {t('themeBy')}{' '}
                <a
                  className='hover:text-foreground focus-visible:text-foreground underline underline-offset-4 focus-visible:outline-none'
                  href='https://glowplug.studio'
                  rel='noopener noreferrer'
                  target='_blank'
                >
                  Glowplug
                </a>
                .
              </span>
            </p>
          </div>
          <div className='text-center'>
            <p className='text-sm leading-6'>
              {t('firstBuiltIn')}{' '}
              <a
                className='hover:text-foreground focus-visible:text-foreground underline underline-offset-4 focus-visible:outline-none'
                href='https://en.wikipedia.org/wiki/Koru'
                rel='noopener noreferrer'
                target='_blank'
              >
                {t('newZealand')}
              </a>
            </p>
            <div className='mt-1 flex justify-center gap-3 text-[11px]'>
              <Link
                className='hover:text-foreground focus-visible:text-foreground underline underline-offset-4 focus-visible:outline-none'
                href='/legal#terms'
              >
                {t('termsOfUse')}
              </Link>
              <Link
                className='hover:text-foreground focus-visible:text-foreground underline underline-offset-4 focus-visible:outline-none'
                href='/legal#privacy'
              >
                {t('privacyPolicy')}
              </Link>
            </div>
          </div>
          <div className='sm:justify-self-end'>
            <SupachargerAttribution />
          </div>
        </div>
      </div>
    </footer>
  );
}
