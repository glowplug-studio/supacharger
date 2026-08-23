'use client';

import { useEffect, useState } from 'react';
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
import { createClient } from '@/lib/supabase/client';
import LogoutButton from '@/supacharger/components/buttons/logout-button';
import { projectProfileIdentity } from '@/supacharger/profile/profile-identity';
import { SC_CONFIG } from '@/supacharger/supacharger-config';
import { cn } from '@/utils/cn';

type AccountMenuTrigger = 'avatar' | 'wide';

type AccountProfile = {
  avatar_path?: string | null;
  email?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  username?: string | null;
};

const menuItemClassName =
  'group flex min-h-10 cursor-pointer items-center gap-3 rounded-sm px-3 py-2 text-sm font-medium text-white outline-none transition-colors focus:bg-white/10 focus:text-white data-[highlighted]:bg-white/10 data-[highlighted]:text-white [&>svg]:size-4 [&>svg]:shrink-0 [&>svg]:text-white/65';

export default function SCAccountMenu({ trigger = 'avatar' }: { trigger?: AccountMenuTrigger }) {
  const [profile, setProfile] = useState<AccountProfile>({});
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const identity = projectProfileIdentity(profile, SC_CONFIG.PROFILE_IDENTITY.USERNAME, { ownerView: true });
  const { setTheme, theme } = useTheme();

  const tAuthTerms = useTranslations('AuthTerms');
  const tAccount = useTranslations('AccountDropdownMenu');
  const tTheme = useTranslations('ThemeChangerMenu');
  const tMenu = useTranslations('SessionNavigation');

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();

    void supabase
      .schema('api')
      .rpc('get_account_profile_by_current_user')
      .then(async ({ data }) => {
        if (cancelled) return;
        const nextProfile = (data?.[0] ?? {}) as AccountProfile;
        setProfile(nextProfile);

        if (!nextProfile.avatar_path) return;
        const { data: signedAvatar } = await supabase.storage
          .from('user-avatars')
          .createSignedUrl(nextProfile.avatar_path, 60 * 60);

        if (!cancelled) setAvatarUrl(signedAvatar?.signedUrl ?? null);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const profileHref = identity.username ? `/profile/${identity.username}` : '/account';
  const subtitle = [profile.email, identity.username ? `@${identity.username}` : null].filter(Boolean).join('  ');

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          aria-label={tMenu('userMenu', { name: identity.displayName })}
          className={cn(
            'focus-visible:ring-ring inline-flex items-center rounded-full transition-colors outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
            trigger === 'wide'
              ? 'bg-foreground text-background hover:bg-foreground/90 w-full gap-3 p-1 pr-3 text-left'
              : 'hover:bg-accent p-1',
          )}
          type='button'
        >
          <Avatar className='size-9 shrink-0 border border-white/10'>
            <AvatarImage alt={identity.displayName} src={avatarUrl ?? undefined} />
            <AvatarFallback className='bg-primary text-primary-foreground text-xs font-semibold'>
              {identity.initials}
            </AvatarFallback>
          </Avatar>
          {trigger === 'wide' ? (
            <span className='min-w-0 flex-1'>
              <span className='block truncate text-sm font-medium'>{identity.displayName}</span>
              {subtitle ? <span className='block truncate text-xs opacity-65'>{subtitle}</span> : null}
            </span>
          ) : null}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align='end'
        className='w-72 overflow-hidden rounded-sm border border-white/10 bg-[#171a18] p-0 text-white shadow-2xl'
        sideOffset={8}
      >
        <DropdownMenuLabel className='bg-[#282d2a] p-0 font-normal'>
          <Link className='flex items-center gap-3 px-4 py-3 transition-colors hover:bg-white/5' href={profileHref}>
            <Avatar className='size-10 shrink-0 border border-white/10'>
              <AvatarImage alt={identity.displayName} src={avatarUrl ?? undefined} />
              <AvatarFallback className='bg-primary text-primary-foreground text-xs font-semibold'>
                {identity.initials}
              </AvatarFallback>
            </Avatar>
            <span className='min-w-0'>
              <span className='block truncate text-sm font-semibold text-white'>{identity.displayName}</span>
              {subtitle ? (
                <span className='mt-0.5 block truncate text-xs font-normal text-white/55'>{subtitle}</span>
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

        <DropdownMenuSeparator className='m-0 bg-white/10' />
        <div className='flex items-center justify-between gap-3 px-4 py-3'>
          <span className='text-sm font-medium text-white'>{tTheme('title')}</span>
          <div aria-label={tTheme('title')} className='flex rounded-sm bg-white/10 p-1' role='group'>
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
                  'inline-flex size-8 items-center justify-center rounded-sm text-white/55 transition-colors hover:bg-white/10 hover:text-white',
                  theme === key && 'bg-white text-[#171a18] hover:bg-white hover:text-[#171a18]',
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

        <DropdownMenuSeparator className='m-0 bg-white/10' />
        <DropdownMenuGroup className='p-1.5'>
          <DropdownMenuItem asChild className={menuItemClassName}>
            <Link href='/whats-included'>
              <CircleHelp aria-hidden='true' />
              {tAccount('help')}
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator className='m-0 bg-white/10' />
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
