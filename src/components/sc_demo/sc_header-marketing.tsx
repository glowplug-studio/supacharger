'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Menu } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from '@/components/ui/navigation-menu';
import { Sheet, SheetClose, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/utils/cn';

import LocaleSwitcher from './sc_locale-switcher';
import SCSiteLogo from './sc_site-logo';

const marketingNavigation = [
  { href: '/#overview', label: 'Overview' },
  { href: '/#features', label: 'Features' },
  { href: '/#integrations', label: 'Integrations' },
  { href: '/#benefits', label: 'Benefits' },
  { href: '/#reviews', label: 'Reviews' },
  { href: '/#pricing', label: 'Pricing' },
];

const navigationLinkClassName =
  'inline-flex h-9 items-center rounded-sm px-3 text-sm font-medium text-white/65 transition-colors hover:bg-white/5 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400';
const authControlClassName = 'h-auto rounded-sm px-5 py-3 text-sm';

export function SCMarketingMenu() {
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
    <header className='fixed inset-x-0 top-0 z-40 border-b border-white/10 bg-[#080a09]/90 text-white backdrop-blur-xl'>
      <div className='mx-auto flex h-16 max-w-7xl items-center px-4 sm:px-6 lg:px-8 xl:grid xl:grid-cols-[1fr_auto_1fr]'>
        <SCSiteLogo darkMode={true} showSiteTitle={true} />

        <NavigationMenu className='hidden xl:flex'>
          <NavigationMenuList className='space-x-1'>
            {marketingNavigation.map((item) => {
              const isActive = activeHref === item.href;

              return (
                <NavigationMenuItem key={item.href}>
                  <NavigationMenuLink asChild>
                    <Link
                      aria-current={isActive ? 'location' : undefined}
                      className={cn(navigationLinkClassName, isActive && 'bg-white/10 text-white hover:bg-white/15')}
                      href={item.href}
                      onClick={() => setActiveHref(item.href)}
                    >
                      {item.label}
                    </Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>
              );
            })}
          </NavigationMenuList>
        </NavigationMenu>

        <div className='hidden items-center gap-3 justify-self-end xl:flex'>
          <Link
            className='inline-flex items-center rounded-sm px-5 py-3 text-sm font-medium text-white/70 transition-colors hover:text-white focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-none'
            href='/account/login'
          >
            Login
          </Link>
          <Button
            asChild
            className={`${authControlClassName} bg-white text-[#080a09] shadow-none hover:bg-white/90`}
            size='sm'
          >
            <Link href='/account/create'>Create account</Link>
          </Button>
          <LocaleSwitcher appearance='marketing' className={authControlClassName} />
        </div>

        <div className='ml-auto flex items-center gap-2 xl:hidden'>
          <LocaleSwitcher appearance='marketing' className={authControlClassName} />
          <Sheet>
            <SheetTrigger asChild>
              <Button
                aria-label='Open navigation'
                className='size-11 rounded-sm border-white/15 bg-transparent text-white shadow-none hover:bg-white/10 hover:text-white'
                size='icon'
                variant='outline'
              >
                <Menu aria-hidden='true' />
              </Button>
            </SheetTrigger>
            <SheetContent className='border-white/10 bg-[#101211] text-white'>
              <SheetHeader>
                <SheetTitle className='text-white'>
                  <SCSiteLogo darkMode={true} showSiteTitle={true} />
                </SheetTitle>
              </SheetHeader>
              <nav aria-label='Mobile navigation' className='flex flex-col gap-1'>
                {marketingNavigation.map((item) => {
                  const isActive = activeHref === item.href;

                  return (
                    <SheetClose asChild key={item.href}>
                      <Link
                        aria-current={isActive ? 'location' : undefined}
                        className={cn(
                          'rounded-sm px-3 py-3 text-base font-medium text-white/75 transition-colors hover:bg-white/5 hover:text-white',
                          isActive && 'bg-white/10 text-white hover:bg-white/15',
                        )}
                        href={item.href}
                        onClick={() => setActiveHref(item.href)}
                      >
                        {item.label}
                      </Link>
                    </SheetClose>
                  );
                })}
              </nav>
              <div className='mt-8 grid gap-3 border-t border-white/10 pt-6'>
                <SheetClose asChild>
                  <Link
                    className='rounded-sm px-5 py-3 text-sm font-medium text-white/70 hover:text-white'
                    href='/account/login'
                  >
                    Login
                  </Link>
                </SheetClose>
                <SheetClose asChild>
                  <Button
                    asChild
                    className='h-auto rounded-sm bg-white px-5 py-3 text-sm text-[#080a09] hover:bg-white/90'
                  >
                    <Link href='/account/create'>Create account</Link>
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
