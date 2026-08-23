'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import {
  BarChart3,
  CircleHelp,
  Database,
  FileChartColumn,
  FileText,
  FolderKanban,
  Inbox,
  LayoutDashboard,
  ListChecks,
  Plus,
  Search,
  Settings,
  Users,
} from 'lucide-react';
import type { ComponentType, CSSProperties } from 'react';

import SCAccountMenu from '@/components/sc_demo/sc_account-menu';
import { SCDashboard } from '@/components/sc_demo/sc_dashboard';
import SCSiteLogo from '@/components/sc_demo/sc_site-logo';
import { Button } from '@/components/ui/button';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from '@/components/ui/sidebar';

type SidebarLink = {
  href: string;
  icon: ComponentType<{ className?: string }>;
  label: string;
};

function LinkGroup({ items }: { items: SidebarLink[] }) {
  return (
    <SidebarMenu>
      {items.map(({ href, icon: Icon, label }) => (
        <SidebarMenuItem key={label}>
          <SidebarMenuButton asChild tooltip={label}>
            <Link href={href}>
              <Icon aria-hidden='true' />
              <span>{label}</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );
}

function DemoSidebar() {
  const t = useTranslations('DashboardDemo');
  const primaryItems: SidebarLink[] = [
    { href: '/sidebar#dashboard', icon: LayoutDashboard, label: t('dashboard') },
    { href: '/sidebar#lifecycle', icon: ListChecks, label: t('lifecycle') },
    { href: '/sidebar#analytics', icon: BarChart3, label: t('analytics') },
    { href: '/sidebar#projects', icon: FolderKanban, label: t('projects') },
    { href: '/sidebar#team', icon: Users, label: t('team') },
  ];
  const documentItems: SidebarLink[] = [
    { href: '/sidebar#projects', icon: Database, label: t('documents.dataLibrary') },
    { href: '/sidebar#analytics', icon: FileChartColumn, label: t('documents.reports') },
    { href: '/sidebar#projects', icon: FileText, label: t('documents.assistant') },
  ];
  const secondaryItems: SidebarLink[] = [
    { href: '/account', icon: Settings, label: t('secondary.settings') },
    { href: '/whats-included', icon: CircleHelp, label: t('secondary.help') },
    { href: '/sidebar#projects', icon: Search, label: t('secondary.search') },
  ];

  return (
    <Sidebar className='border-sidebar-border' collapsible='icon' variant='inset'>
      <SidebarHeader className='border-sidebar-border border-b p-3'>
        <div className='overflow-hidden px-1 py-1 group-data-[collapsible=icon]:px-0'>
          <SCSiteLogo showSiteTitle={true} />
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent className='flex flex-col gap-2'>
            <SidebarMenu>
              <SidebarMenuItem className='flex items-center gap-2'>
                <SidebarMenuButton
                  className='bg-foreground text-background hover:bg-foreground/90 hover:text-background active:bg-foreground/90 active:text-background'
                  tooltip={t('quickCreate')}
                >
                  <Plus aria-hidden='true' />
                  <span>{t('quickCreate')}</span>
                </SidebarMenuButton>
                <Button
                  aria-label={t('inbox')}
                  className='size-8 shrink-0 rounded-sm group-data-[collapsible=icon]:hidden'
                  size='icon'
                  variant='outline'
                >
                  <Inbox aria-hidden='true' className='size-4' />
                </Button>
              </SidebarMenuItem>
            </SidebarMenu>
            <LinkGroup items={primaryItems} />
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>{t('documents.title')}</SidebarGroupLabel>
          <SidebarGroupContent>
            <LinkGroup items={documentItems} />
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className='mt-auto'>
          <SidebarGroupContent>
            <LinkGroup items={secondaryItems} />
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className='border-sidebar-border border-t p-3'>
        <SCAccountMenu trigger='wide' />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}

export function SCDashboardSidebar() {
  const t = useTranslations('DashboardDemo');

  return (
    <SidebarProvider
      style={
        {
          '--sidebar-width': '17rem',
          '--sidebar-width-icon': '3.5rem',
        } as CSSProperties
      }
    >
      <DemoSidebar />
      <SidebarInset className='border-border min-w-0 overflow-hidden border md:my-2 md:mr-2 md:rounded-sm'>
        <header className='border-border bg-background/90 sticky top-0 z-30 flex h-14 shrink-0 items-center gap-3 border-b px-4 backdrop-blur-xl lg:px-6'>
          <SidebarTrigger className='-ml-1 rounded-sm' />
          <span aria-hidden='true' className='bg-border h-5 w-px' />
          <h1 className='text-sm font-medium'>{t('overview')}</h1>
          <nav aria-label={t('layoutNavigation')} className='ml-auto hidden items-center gap-1 sm:flex'>
            <Button asChild className='rounded-sm' size='sm' variant='ghost'>
              <Link href='/'>{t('horizontalNav')}</Link>
            </Button>
            <Button asChild className='rounded-sm' size='sm' variant='secondary'>
              <Link aria-current='page' href='/sidebar'>
                {t('sidebarNav')}
              </Link>
            </Button>
          </nav>
        </header>
        <SCDashboard />
      </SidebarInset>
    </SidebarProvider>
  );
}
