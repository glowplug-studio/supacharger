'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { BadgeDollarSign, ExternalLink, ListChecks, Menu, Scale, UploadCloud } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '@/components/ui/navigation-menu';
import { Sheet, SheetClose, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/utils/cn';

import LocaleSwitcher from './sc_locale-switcher';
import SCSiteLogo from './sc_site-logo';

const marketingNavigation = [
  { href: '/#overview', labelKey: 'overview' },
  { href: '/#features', labelKey: 'features' },
  { href: '/#integrations', labelKey: 'integrations' },
  { href: '/#benefits', labelKey: 'benefits' },
  { href: '/#reviews', labelKey: 'reviews' },
  { href: '/#pricing', labelKey: 'pricing' },
];

const navigationLinkClassName =
  'inline-flex h-9 items-center rounded-lg px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';
const navigationTriggerClassName =
  'h-9 rounded-lg px-3 py-0 text-sm text-muted-foreground hover:bg-accent hover:text-foreground focus:bg-accent focus:text-foreground focus-visible:ring-2 focus-visible:ring-ring data-[state=open]:bg-accent data-[state=open]:text-foreground';
const authControlClassName = 'h-auto rounded-lg px-5 py-3 text-sm';

export function SCMarketingMenu() {
  const t = useTranslations('MarketingNavigation');
  const [activeHref, setActiveHref] = useState<string | null>(null);

  useEffect(() => {
    const updateFromHash = () => {
      if (!window.location.hash) {
        setActiveHref(null);
        return;
      }

      const matchingItem = marketingNavigation.find(({ href }) => href.endsWith(window.location.hash));
      setActiveHref(matchingItem?.href ?? null);
    };

    updateFromHash();
    window.addEventListener('hashchange', updateFromHash);

    const sections = marketingNavigation
      .map(({ href }) => document.getElementById(href.slice(2)))
      .filter((section): section is HTMLElement => section !== null);
    const observer = new IntersectionObserver(
      (entries) => {
        const activeSection = entries.find((entry) => entry.isIntersecting);

        if (activeSection) setActiveHref(`/#${activeSection.target.id}`);
      },
      { rootMargin: '-64px 0px -75% 0px' },
    );

    sections.forEach((section) => observer.observe(section));

    return () => {
      observer.disconnect();
      window.removeEventListener('hashchange', updateFromHash);
    };
  }, []);

  return (
    <header className='border-border bg-background/90 text-foreground fixed inset-x-0 top-0 z-40 border-b backdrop-blur-xl'>
      <div className='mx-auto flex h-16 max-w-7xl items-center px-4 sm:px-6 lg:px-8 xl:grid xl:grid-cols-[1fr_auto_1fr]'>
        <SCSiteLogo showSiteTitle={true} />

        <NavigationMenu className='hidden xl:flex'>
          <NavigationMenuList className='space-x-1'>
            <NavigationMenuItem>
              <NavigationMenuTrigger className={navigationTriggerClassName}>
                {t('inPageAnchors')}
              </NavigationMenuTrigger>
              <NavigationMenuContent className='w-[15rem] max-w-none rounded-lg p-2 md:w-[15rem]'>
                <ul className='grid gap-1'>
                  {marketingNavigation.map((item) => {
                    const isActive = activeHref === item.href;

                    return (
                      <li key={item.href}>
                        <NavigationMenuLink asChild>
                          <Link
                            aria-current={isActive ? 'location' : undefined}
                            className={cn(
                              'text-muted-foreground hover:bg-accent hover:text-foreground focus:bg-accent focus:text-foreground block rounded-lg px-3 py-2.5 text-sm font-medium transition-colors outline-none',
                              isActive && 'bg-accent text-foreground',
                            )}
                            href={item.href}
                            onClick={() => setActiveHref(item.href)}
                          >
                            {t(item.labelKey)}
                          </Link>
                        </NavigationMenuLink>
                      </li>
                    );
                  })}
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>

            <NavigationMenuItem>
              <NavigationMenuTrigger className={navigationTriggerClassName}>
                {t('supachargerFeatures')}
              </NavigationMenuTrigger>
              <NavigationMenuContent className='w-[58rem] max-w-none rounded-lg p-0 md:w-[58rem]'>
                <div className='grid grid-cols-4'>
                  <NavigationMenuLink asChild>
                    <Link
                      className='hover:bg-accent focus:bg-accent group flex gap-3 p-5 transition-colors outline-none'
                      href='/features/whats-included'
                    >
                      <ListChecks aria-hidden='true' className='text-primary mt-0.5 size-5 shrink-0' />
                      <span className='min-w-0'>
                        <span className='text-foreground block text-sm font-semibold'>
                          {t('whatsIncluded')}
                        </span>
                        <span className='text-muted-foreground group-hover:text-foreground/80 mt-2 block text-sm leading-5'>
                          {t('whatsIncludedDescription')}
                        </span>
                      </span>
                    </Link>
                  </NavigationMenuLink>
                  <NavigationMenuLink asChild>
                    <Link
                      className='border-border hover:bg-accent focus:bg-accent group flex gap-3 border-l p-5 transition-colors outline-none'
                      href='/features/paywall-demos'
                    >
                      <BadgeDollarSign aria-hidden='true' className='text-primary mt-0.5 size-5 shrink-0' />
                      <span className='min-w-0'>
                        <span className='text-foreground block text-sm font-semibold'>
                          {t('paywallDemos')}
                        </span>
                        <span className='text-muted-foreground group-hover:text-foreground/80 mt-2 block text-sm leading-5'>
                          {t('paywallDemosDescription')}
                        </span>
                      </span>
                    </Link>
                  </NavigationMenuLink>
                  <NavigationMenuLink asChild>
                    <Link
                      className='border-border hover:bg-accent focus:bg-accent group flex gap-3 border-l p-5 transition-colors outline-none'
                      href='/features/core-widget-demos'
                    >
                      <UploadCloud aria-hidden='true' className='text-primary mt-0.5 size-5 shrink-0' />
                      <span className='min-w-0'>
                        <span className='text-foreground block text-sm font-semibold'>{t('coreWidgetDemos')}</span>
                        <span className='text-muted-foreground group-hover:text-foreground/80 mt-2 block text-sm leading-5'>
                          {t('coreWidgetDemosDescription')}
                        </span>
                      </span>
                    </Link>
                  </NavigationMenuLink>
                  <NavigationMenuLink asChild>
                  <Link className='border-border bg-muted/35 hover:bg-accent flex gap-3 border-l p-5' href='/license'>
                    <Scale aria-hidden='true' className='text-primary mt-0.5 size-5 shrink-0' />
                    <span className='min-w-0'>
                      <span className='text-foreground block text-sm font-semibold'>
                        {t('licenseInformation')}
                      </span>
                      <span className='text-muted-foreground mt-2 block text-sm leading-5'>
                        {t('licenseInformationDescription')}
                      </span>
                    </span>
                  </Link>
                  </NavigationMenuLink>
                </div>
              </NavigationMenuContent>
            </NavigationMenuItem>

            <NavigationMenuItem>
              <NavigationMenuLink asChild>
                <a
                  aria-label={`${t('supacharger')} (${t('opensInNewTab')})`}
                  className={cn(navigationLinkClassName, 'gap-1.5')}
                  href='https://supacharger.dev'
                  rel='noopener noreferrer'
                  target='_blank'
                >
                  {t('supacharger')}
                  <ExternalLink aria-hidden='true' className='size-3.5' />
                </a>
              </NavigationMenuLink>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuLink asChild>
                <Link className={navigationLinkClassName} href='/license'>{t('license')}</Link>
              </NavigationMenuLink>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>

        <div className='hidden items-center gap-3 justify-self-end xl:flex'>
          <Link
            className='text-muted-foreground hover:text-foreground focus-visible:ring-ring inline-flex items-center rounded-lg px-5 py-3 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none'
            href='/account/login'
          >
            {t('login')}
          </Link>
          <Button
            asChild
            className={`${authControlClassName} bg-foreground text-background hover:bg-foreground/90 shadow-none`}
            size='sm'
          >
            <Link href='/account/create'>{t('createAccount')}</Link>
          </Button>
          <LocaleSwitcher appearance='marketing' className={authControlClassName} />
        </div>

        <div className='ml-auto flex items-center gap-2 xl:hidden'>
          <LocaleSwitcher appearance='marketing' className={authControlClassName} />
          <Sheet>
            <SheetTrigger asChild>
              <Button
                aria-label={t('openNavigation')}
                className='border-border text-foreground hover:bg-accent hover:text-foreground size-11 rounded-lg bg-transparent shadow-none'
                size='icon'
                variant='outline'
              >
                <Menu aria-hidden='true' />
              </Button>
            </SheetTrigger>
            <SheetContent className='border-border bg-background text-foreground'>
              <SheetHeader>
                <SheetTitle className='text-foreground'>
                  <SCSiteLogo showSiteTitle={true} />
                </SheetTitle>
              </SheetHeader>
              <nav aria-label={t('mobileNavigation')} className='flex flex-col gap-6 overflow-y-auto'>
                <div>
                  <p className='text-foreground px-3 pb-2 text-sm font-semibold'>
                    {t('inPageAnchors')}
                  </p>
                  <div className='grid grid-cols-2 gap-1'>
                    {marketingNavigation.map((item) => {
                      const isActive = activeHref === item.href;

                      return (
                        <SheetClose asChild key={item.href}>
                          <Link
                            aria-current={isActive ? 'location' : undefined}
                            className={cn(
                              'text-muted-foreground hover:bg-accent hover:text-foreground rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                              isActive && 'bg-accent text-foreground hover:bg-accent',
                            )}
                            href={item.href}
                            onClick={() => setActiveHref(item.href)}
                          >
                            {t(item.labelKey)}
                          </Link>
                        </SheetClose>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <p className='text-foreground px-3 pb-2 text-sm font-semibold'>
                    {t('supachargerFeatures')}
                  </p>
                  <div className='grid gap-1'>
                    <SheetClose asChild>
                      <Link className='hover:bg-accent rounded-lg px-3 py-3' href='/features/whats-included'>
                        <span className='text-foreground block text-sm font-semibold'>
                          {t('whatsIncluded')}
                        </span>
                        <span className='text-muted-foreground mt-1 block text-sm leading-5'>
                          {t('whatsIncludedDescription')}
                        </span>
                      </Link>
                    </SheetClose>
                    <SheetClose asChild>
                      <Link className='hover:bg-accent rounded-lg px-3 py-3' href='/features/paywall-demos'>
                        <span className='text-foreground block text-sm font-semibold'>
                          {t('paywallDemos')}
                        </span>
                        <span className='text-muted-foreground mt-1 block text-sm leading-5'>
                          {t('paywallDemosDescription')}
                        </span>
                      </Link>
                    </SheetClose>
                    <SheetClose asChild>
                      <Link className='hover:bg-accent rounded-lg px-3 py-3' href='/features/core-widget-demos'>
                        <span className='text-foreground block text-sm font-semibold'>{t('coreWidgetDemos')}</span>
                        <span className='text-muted-foreground mt-1 block text-sm leading-5'>
                          {t('coreWidgetDemosDescription')}
                        </span>
                      </Link>
                    </SheetClose>
                    <SheetClose asChild><Link className='bg-muted/35 hover:bg-accent rounded-lg px-3 py-3' href='/license'>
                      <span className='text-foreground block text-sm font-semibold'>
                        {t('licenseInformation')}
                      </span>
                      <span className='text-muted-foreground mt-1 block text-sm leading-5'>
                        {t('licenseInformationDescription')}
                      </span>
                    </Link></SheetClose>
                  </div>
                </div>

                <SheetClose asChild>
                  <a
                    aria-label={`${t('supacharger')} (${t('opensInNewTab')})`}
                    className='text-muted-foreground hover:bg-accent hover:text-foreground inline-flex items-center gap-2 rounded-lg px-3 py-3 text-sm font-semibold'
                    href='https://supacharger.dev'
                    rel='noopener noreferrer'
                    target='_blank'
                  >
                    {t('supacharger')}
                    <ExternalLink aria-hidden='true' className='size-4' />
                  </a>
                </SheetClose>
                <SheetClose asChild>
                  <Link className='text-muted-foreground hover:bg-accent hover:text-foreground rounded-lg px-3 py-3 text-sm font-semibold' href='/license'>
                    {t('license')}
                  </Link>
                </SheetClose>
              </nav>
              <div className='border-border mt-8 grid gap-3 border-t pt-6'>
                <SheetClose asChild>
                  <Link
                    className='text-muted-foreground hover:text-foreground rounded-lg px-5 py-3 text-sm font-medium'
                    href='/account/login'
                  >
                    {t('login')}
                  </Link>
                </SheetClose>
                <SheetClose asChild>
                  <Button
                    asChild
                    className='bg-foreground text-background hover:bg-foreground/90 h-auto rounded-lg px-5 py-3 text-sm'
                  >
                    <Link href='/account/create'>{t('createAccount')}</Link>
                  </Button>
                </SheetClose>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
