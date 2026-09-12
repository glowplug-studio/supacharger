'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useTheme } from 'next-themes';
import { CircleHelp, CreditCard, LogOut, Monitor, Moon, Settings, Sun, User } from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAccountSummary } from '@/supacharger/account/use-account-summary';
import LogoutButton from '@/supacharger/components/buttons/logout-button';
import { cn } from '@/utils/cn';

type AccountMenuTrigger = 'avatar' | 'wide';

const menuItemClassName =
  'group text-foreground focus:bg-accent focus:text-accent-foreground data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground flex min-h-10 cursor-pointer items-center gap-3 rounded-sm px-3 py-2 text-sm font-medium outline-none transition-colors [&>svg]:size-4 [&>svg]:shrink-0 [&>svg]:text-muted-foreground';

export default function SCAccountMenu({ trigger = 'avatar' }: { trigger?: AccountMenuTrigger }) {
  const { summary } = useAccountSummary();
  const displayName = summary?.displayName ?? 'Account';
  const initials = summary?.initials ?? 'A';
  const { setTheme, theme } = useTheme();

  const tAuthTerms = useTranslations('AuthTerms');
  const tAccount = useTranslations('AccountDropdownMenu');
  const tTheme = useTranslations('ThemeChangerMenu');
  const tMenu = useTranslations('SessionNavigation');

  const profileHref = summary?.profileHref ?? '/account';
  const subtitle = [summary?.email, summary?.username ? `@${summary.username}` : null].filter(Boolean).join('  ');

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          aria-label={tMenu('userMenu', { name: displayName })}
          className={cn(
            'focus-visible:ring-ring inline-flex items-center rounded-full transition-colors outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
            trigger === 'wide'
              ? 'border-border bg-card text-card-foreground hover:bg-accent hover:text-accent-foreground group-data-[collapsible=icon]:text-foreground group-data-[collapsible=icon]:hover:bg-accent w-full gap-3 border p-1 pr-3 text-left group-data-[collapsible=icon]:size-9 group-data-[collapsible=icon]:gap-0 group-data-[collapsible=icon]:border-transparent group-data-[collapsible=icon]:bg-transparent group-data-[collapsible=icon]:p-0'
              : 'hover:bg-accent p-1',
          )}
          type='button'
        >
          <Avatar className='border-border size-9 shrink-0 border'>
            <AvatarImage alt={displayName} src={summary?.avatarUrl ?? undefined} />
            <AvatarFallback className='bg-primary text-primary-foreground text-xs font-semibold'>
              {initials}
            </AvatarFallback>
          </Avatar>
          {trigger === 'wide' ? (
            <span className='min-w-0 flex-1 group-data-[collapsible=icon]:hidden'>
              <span className='block truncate text-sm font-medium'>{displayName}</span>
              {subtitle ? <span className='block truncate text-xs opacity-65'>{subtitle}</span> : null}
            </span>
          ) : null}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align='end'
        className='border-border bg-popover text-popover-foreground w-72 overflow-hidden rounded-sm border p-0 shadow-2xl'
        sideOffset={8}
      >
        <DropdownMenuLabel className='bg-muted p-0 font-normal'>
          <Link className='hover:bg-accent flex items-center gap-3 px-4 py-3 transition-colors' href={profileHref}>
            <Avatar className='border-border size-10 shrink-0 border'>
              <AvatarImage alt={displayName} src={summary?.avatarUrl ?? undefined} />
              <AvatarFallback className='bg-primary text-primary-foreground text-xs font-semibold'>
                {initials}
              </AvatarFallback>
            </Avatar>
            <span className='min-w-0'>
              <span className='text-foreground block truncate text-sm font-semibold'>{displayName}</span>
              {subtitle ? (
                <span className='text-muted-foreground mt-0.5 block truncate text-xs font-normal'>{subtitle}</span>
              ) : null}
            </span>
          </Link>
        </DropdownMenuLabel>

        <DropdownMenuGroup className='space-y-0.5 p-1.5'>
          <DropdownMenuItem asChild className={menuItemClassName}>
            <Link href={profileHref}>
              <User aria-hidden='true' />
              {tAccount('viewProfile')}
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild className={menuItemClassName}>
            <Link href='/account'>
              <Settings aria-hidden='true' />
              {tAccount('accountSettings')}
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild className={menuItemClassName}>
            <Link href='/account/billing'>
              <CreditCard aria-hidden='true' />
              {tAccount('billing')}
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator className='bg-border m-0' />
        <div className='flex items-center justify-between gap-3 px-4 py-3'>
          <span className='text-foreground text-sm font-medium'>{tTheme('title')}</span>
          <div aria-label={tTheme('title')} className='bg-muted flex rounded-sm p-1' role='group'>
            {(
              [
                { icon: Sun, key: 'light' },
                { icon: Moon, key: 'dark' },
                { icon: Monitor, key: 'system' },
              ] as const
            ).map(({ icon: Icon, key }) => (
              <button
                aria-label={tTheme(key)}
                aria-pressed={theme === key}
                className={cn(
                  'text-muted-foreground hover:bg-accent hover:text-foreground inline-flex size-8 items-center justify-center rounded-sm transition-colors',
                  theme === key && 'bg-background text-foreground hover:bg-background hover:text-foreground shadow-sm',
                )}
                key={key}
                onClick={(event) => {
                  event.preventDefault();
                  setTheme(key);
                }}
                type='button'
              >
                <Icon aria-hidden='true' className='size-4' />
              </button>
            ))}
          </div>
        </div>

        <DropdownMenuSeparator className='bg-border m-0' />
        <DropdownMenuGroup className='p-1.5'>
          <DropdownMenuItem asChild className={menuItemClassName}>
            <Link href='/features/whats-included'>
              <CircleHelp aria-hidden='true' />
              {tAccount('help')}
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator className='bg-border m-0' />
        <DropdownMenuItem asChild>
          <LogoutButton className={cn(menuItemClassName, 'm-1.5 w-[calc(100%-0.75rem)] text-left')}>
            <LogOut aria-hidden='true' />
            {tAuthTerms('logOut')}
          </LogoutButton>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
