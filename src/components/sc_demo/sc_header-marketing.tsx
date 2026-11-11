'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { ExternalLink, ListChecks, Menu, Scale, UploadCloud, Wallet } from 'lucide-react';

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

const featuresNavigation = [
  {
    href: '/features/paywall-demos',
    labelKey: 'paywallDemos',
    descriptionKey: 'paywallDemosDescription',
    icon: Wallet,
  },
  {
    href: '/features/core-widget-demos',
    labelKey: 'coreWidgetDemos',
    descriptionKey: 'coreWidgetDemosDescription',
    icon: UploadCloud,
  },
  {
    href: '/features/whats-included',
    labelKey: 'whatsIncluded',
    descriptionKey: 'whatsIncludedDescription',
    icon: ListChecks,
    isNew: true,
  },
  {
    href: '/license',
    labelKey: 'licenseInformation',
    descriptionKey: 'licenseInformationDescription',
    icon: Scale,
  },
];

const navigationLinkClassName =
  'inline-flex h-9 items-center rounded-lg px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';
const navigationTriggerClassName =
  'h-9 rounded-lg px-3 py-0 text-sm text-muted-foreground hover:bg-accent hover:text-foreground focus:bg-accent focus:text-foreground focus-visible:ring-2 focus-visible:ring-ring data-[state=open]:bg-accent data-[state=open]:text-foreground';
const authControlClassName = 'h-auto rounded-lg px-5 py-3 text-sm';

export function SCMarketingMenu() {
  const t = useTranslations('MarketingNavigation');
  const [activeHref, setActiveHref] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRootRef = useRef<React.ComponentRef<typeof NavigationMenu> | null>(null);
  const [featuresMenuOffset, setFeaturesMenuOffset] = useState(0);

  useEffect(() => {
    const measureFeaturesMenuOffset = () => {
      const menu = menuRootRef.current;
      if (!menu) return;
      const menuRect = menu.getBoundingClientRect();
      // The viewport hangs from the nav list's left edge; shift it so the
      // wide features panel is centred in the page, not under its trigger.
      setFeaturesMenuOffset(Math.round(window.innerWidth / 2 - menuRect.left - 704 / 2));
    };

    measureFeaturesMenuOffset();
    window.addEventListener('resize', measureFeaturesMenuOffset);
    document.fonts?.ready.then(measureFeaturesMenuOffset).catch(() => {});

    return () => {
      window.removeEventListener('resize', measureFeaturesMenuOffset);
    };
  }, []);

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
    <>
      <div
        aria-hidden='true'
        className='pointer-events-none fixed inset-0 z-30 bg-black/20 opacity-0 transition-opacity duration-300 data-[state=open]:pointer-events-auto data-[state=open]:opacity-100'
        data-state={menuOpen ? 'open' : 'closed'}
      />
      <header className='border-border bg-background/90 text-foreground fixed inset-x-0 top-0 z-40 border-b shadow-[0_1px_2px_0_rgba(0,0,0,0.06)] backdrop-blur-xl'>
        <div className='mx-auto flex h-16 max-w-7xl items-center px-4 sm:px-6 lg:px-8 xl:grid xl:grid-cols-[1fr_auto_1fr]'>
          <SCSiteLogo showSiteTitle={true} />

          <NavigationMenu
            className='hidden xl:flex'
            ref={menuRootRef}
            viewportStyle={{ transform: `translateX(${featuresMenuOffset}px)` }}
            onValueChange={(value) => setMenuOpen(value !== '')}
          >
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
                <NavigationMenuContent className='w-[44rem] max-w-none rounded-lg p-0 md:w-[44rem]'>
                  <div className='flex'>
                    <div className='w-[24rem] shrink-0 p-3'>
                      <p className='text-muted-foreground px-3 pt-1 pb-2 text-xs font-medium tracking-[0.08em] uppercase'>
                        {t('featuresGroupLabel')}
                      </p>
                      <ul className='grid gap-1'>
                        {featuresNavigation.map((item) => {
                          const FeatureIcon = item.icon;

                          return (
                            <li key={item.href}>
                              <NavigationMenuLink asChild>
                                <Link
                                  className='hover:bg-accent focus:bg-accent group flex gap-3 rounded-lg p-3 transition-colors outline-none'
                                  href={item.href}
                                >
                                  <FeatureIcon aria-hidden='true' className='text-primary mt-0.5 size-5 shrink-0' />
                                  <span className='min-w-0'>
                                    <span className='flex items-center gap-2'>
                                      <span className='text-foreground block text-sm font-semibold'>
                                        {t(item.labelKey)}
                                      </span>
                                      {item.isNew ? (
                                        <span className='bg-foreground text-background rounded-full px-1.5 py-0.5 text-[10px] font-semibold tracking-[0.08em] uppercase'>
                                          {t('newBadge')}
                                        </span>
                                      ) : null}
                                    </span>
                                    <span className='text-muted-foreground group-hover:text-foreground/80 mt-1 block text-sm leading-5'>
                                      {t(item.descriptionKey)}
                                    </span>
                                  </span>
                                </Link>
                              </NavigationMenuLink>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                    <NavigationMenuLink asChild>
                      <Link
                        className='relative hidden w-[20rem] overflow-hidden lg:block'
                        href='/features/whats-included'
                      >
                        <Image
                          alt={t('promoImageAlt')}
                          className='object-cover'
                          fill
                          src='/images/sc_demo/fern-login-sidecar.webp'
                        />
                        <span className='absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent' />
                        <span className='absolute right-0 bottom-0 left-0 p-5'>
                          <span className='block font-sans text-base font-semibold text-white'>{t('promoTitle')}</span>
                          <span className='mt-1 block text-sm leading-5 text-white/80'>{t('promoDescription')}</span>
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
                  <Link className={navigationLinkClassName} href='/license'>
                    {t('license')}
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>

          <div className='hidden items-center gap-3 justify-self-end xl:flex'>
            <Link
              className='text-muted-foreground hover:text-foreground focus-visible:ring-ring inline-flex items-center rounded-lg px-0 py-3 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none'
              href='/account/login'
            >
              {t('login')}
            </Link>
            <Button
              asChild
              className={`${authControlClassName} bg-foreground text-background hover:bg-foreground/90 shadow-[0_2px_10px_-2px_rgba(0,0,0,0.3)]`}
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
                    <p className='text-foreground px-3 pb-2 text-sm font-semibold'>{t('inPageAnchors')}</p>
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
                    <p className='text-foreground px-3 pb-2 text-sm font-semibold'>{t('supachargerFeatures')}</p>
                    <div className='grid gap-1'>
                      {featuresNavigation.map((item) => {
                        const FeatureIcon = item.icon;

                        return (
                          <SheetClose asChild key={item.href}>
                            <Link className='hover:bg-accent flex gap-3 rounded-lg px-3 py-3' href={item.href}>
                              <FeatureIcon aria-hidden='true' className='text-primary mt-0.5 size-5 shrink-0' />
                              <span className='min-w-0'>
                                <span className='text-foreground block text-sm font-semibold'>{t(item.labelKey)}</span>
                                <span className='text-muted-foreground mt-1 block text-sm leading-5'>
                                  {t(item.descriptionKey)}
                                </span>
                              </span>
                            </Link>
                          </SheetClose>
                        );
                      })}
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
                    <Link
                      className='text-muted-foreground hover:bg-accent hover:text-foreground rounded-lg px-3 py-3 text-sm font-semibold'
                      href='/license'
                    >
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
                      className='bg-foreground text-background hover:bg-foreground/90 h-auto rounded-lg px-5 py-3 text-sm shadow-[0_2px_10px_-2px_rgba(0,0,0,0.3)]'
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
    </>
  );
}
