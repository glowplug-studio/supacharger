'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { BarChart3, FolderKanban, Inbox, LayoutDashboard, ListChecks, Menu, Users } from 'lucide-react';

import SCAccountMenu from '@/components/sc_demo/sc_account-menu';
import { Button } from '@/supacharger/components/ui/button';
import { Sheet, SheetClose, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/supacharger/components/ui/sheet';
import { cn } from '@/utils/cn';

import SCSiteLogo from './sc_site-logo';

const dashboardLinks = [
  { href: '/#dashboard', icon: LayoutDashboard, key: 'dashboard' },
  { href: '/#lifecycle', icon: ListChecks, key: 'lifecycle' },
  { href: '/#analytics', icon: BarChart3, key: 'analytics' },
  { href: '/#projects', icon: FolderKanban, key: 'projects' },
  { href: '/#team', icon: Users, key: 'team' },
] as const;

export function SCHeaderSession() {
  const t = useTranslations('DashboardDemo');
  const tSession = useTranslations('SessionNavigation');
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const routeLinks = [
    { href: '/', label: t('horizontalNav') },
    { href: '/sidebar', label: t('sidebarNav') },
  ];

  return (
    <header className='border-border bg-background/90 text-foreground sticky inset-x-0 top-0 z-40 border-b backdrop-blur-xl'>
      <div className='mx-auto flex h-16 max-w-[1440px] items-center gap-5 px-4 sm:px-6 lg:px-8'>
        <SCSiteLogo showSiteTitle={true} />

        <nav aria-label={tSession('mainNavigation')} className='hidden min-w-0 flex-1 items-center gap-1 xl:flex'>
          {routeLinks.map((link) => (
            <Link
              aria-current={pathname === link.href ? 'page' : undefined}
              className={cn(
                'hover:bg-accent hover:text-foreground focus-visible:ring-ring inline-flex h-9 shrink-0 items-center rounded-sm px-3 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none',
                pathname === link.href ? 'bg-accent text-foreground' : 'text-muted-foreground',
              )}
              href={link.href}
              key={link.href}
            >
              {link.label}
            </Link>
          ))}

          <span aria-hidden='true' className='bg-border mx-2 h-5 w-px shrink-0' />

          <Link
            className='text-muted-foreground hover:bg-accent hover:text-foreground inline-flex h-9 shrink-0 items-center gap-2 rounded-sm px-3 text-sm font-medium transition-colors'
            href='/#inbox'
          >
            <Inbox aria-hidden='true' className='size-4' />
            {t('inbox')}
          </Link>
          {dashboardLinks.map(({ href, icon: Icon, key }) => (
            <Link
              className='text-muted-foreground hover:bg-accent hover:text-foreground inline-flex h-9 shrink-0 items-center gap-2 rounded-sm px-3 text-sm font-medium transition-colors'
              href={href}
              key={key}
            >
              <Icon aria-hidden='true' className='size-4' />
              {t(key)}
            </Link>
          ))}
        </nav>

        <div className='ml-auto flex items-center gap-2'>
          <div className='hidden xl:block'>
            <SCAccountMenu />
          </div>
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger
              render={
                <Button
                  aria-label={tSession('openNavigation')}
                  className='border-border size-10 rounded-sm shadow-none xl:hidden'
                  size='icon'
                  variant='outline'
                >
                  <Menu aria-hidden='true' className='size-5' />
                </Button>
              }
            />
            <SheetContent
              className='bg-background text-foreground border-border flex w-[min(90vw,22rem)] flex-col p-0'
              side='right'
            >
              <SheetHeader className='border-border border-b p-5 text-left'>
                <SheetTitle>
                  <SCSiteLogo showSiteTitle={true} />
                </SheetTitle>
              </SheetHeader>
              <nav aria-label={tSession('navigationMenu')} className='flex flex-1 flex-col gap-1 overflow-y-auto p-4'>
                {routeLinks.map((link) => (
                  <SheetClose
                    key={link.href}
                    render={
                      <Link className='hover:bg-accent rounded-sm px-3 py-2.5 text-sm font-medium' href={link.href}>
                        {link.label}
                      </Link>
                    }
                  />
                ))}
                <div className='bg-border my-2 h-px' />
                <SheetClose
                  render={
                    <Link
                      className='hover:bg-accent flex items-center gap-2 rounded-sm px-3 py-2.5 text-sm font-medium'
                      href='/#inbox'
                    >
                      <Inbox aria-hidden='true' className='size-4' />
                      {t('inbox')}
                    </Link>
                  }
                />
                {dashboardLinks.map(({ href, icon: Icon, key }) => (
                  <SheetClose
                    key={key}
                    render={
                      <Link
                        className='hover:bg-accent flex items-center gap-2 rounded-sm px-3 py-2.5 text-sm font-medium'
                        href={href}
                      >
                        <Icon aria-hidden='true' className='size-4' />
                        {t(key)}
                      </Link>
                    }
                  />
                ))}
              </nav>
              <div className='border-border border-t p-4'>
                <SCAccountMenu trigger='wide' />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
