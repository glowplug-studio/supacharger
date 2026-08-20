'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useTheme } from 'next-themes';
import { CreditCard, LogOut, MonitorCog, Moon, Settings, Sun, SunMoon, User } from 'lucide-react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { createClient } from '@/lib/supabase/client';
import LogoutButton from '@/supacharger/components/buttons/logout-button';
import { projectProfileIdentity } from '@/supacharger/profile/profile-identity';
import { SC_CONFIG } from '@/supacharger/supacharger-config';

const focusClasses = 'focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2';

export default function SCAccountMenu() {
  const [profile, setProfile] = useState<{
    first_name?: string | null;
    last_name?: string | null;
    username?: string | null;
    email?: string | null;
  }>({});
  const identity = projectProfileIdentity(profile, SC_CONFIG.PROFILE_IDENTITY.USERNAME, { ownerView: true });

  useEffect(() => {
    const supabase = createClient();
    void supabase
      .schema('api')
      .rpc('get_account_profile_by_current_user')
      .then(({ data }) => setProfile(data?.[0] ?? {}));
  }, []);

  const { setTheme } = useTheme();

  const tAuthTerms = useTranslations('AuthTerms');
  const tAccountDropdownMenu = useTranslations('AccountDropdownMenu');
  const tThemeChangerMenu = useTranslations('ThemeChangerMenu');

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className={`flex items-center rounded-full ${focusClasses}`} aria-label={`User menu for ${identity.displayName}`}>
          <div className='flex h-8 w-8 items-center justify-center rounded-full bg-primary'>
            <span className='text-sm font-bold text-white' aria-hidden='true'>
              {identity.initials}
            </span>
          </div>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end' className='w-48'>
        <DropdownMenuLabel>{identity.displayName}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link href='/account' className='flex items-center gap-2 py-2 text-xs  hover:cursor-pointer'>
              <Settings size={18} /> {tAccountDropdownMenu('accountSettings')}
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href='/account/billing' className='flex items-center gap-2 py-2 text-xs  hover:cursor-pointer'>
              <CreditCard size={18} /> {tAccountDropdownMenu('billing')}
            </Link>
          </DropdownMenuItem>
          {identity.username ? (
            <DropdownMenuItem asChild>
              <Link href={`/profile/${identity.username}`} className='flex items-center gap-2 py-2 text-xs hover:cursor-pointer'>
                <User size={18} /> {tAccountDropdownMenu('myProfile')}
              </Link>
            </DropdownMenuItem>
          ) : null}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuLabel className='text-xs font-bold'>Preferences</DropdownMenuLabel>
          <DropdownMenuItem>Language</DropdownMenuItem>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger className='text-xs'>
              <span><SunMoon className='inline mr-2 '/> {tThemeChangerMenu('title')}</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuItem className='text-xs  hover:cursor-pointer' onClick={() => setTheme('light')}>
                <Sun size={14} /> {tThemeChangerMenu('light')}
              </DropdownMenuItem>
              <DropdownMenuItem className='text-xs  hover:cursor-pointer' onClick={() => setTheme('dark')}>
                <Moon size={14} /> {tThemeChangerMenu('dark')}
              </DropdownMenuItem>
              <DropdownMenuItem className='text-xs hover:cursor-pointer' onClick={() => setTheme('system')}>
                <MonitorCog size={14} />  {tThemeChangerMenu('system')}
              </DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <LogoutButton className='flex w-full items-center gap-2 px-2 py-1.5 text-left text-xs transition-colors'>
            <LogOut size={14} />
            {tAuthTerms('logOut')}
          </LogoutButton>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
