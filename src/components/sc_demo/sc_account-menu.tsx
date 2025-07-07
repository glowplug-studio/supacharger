'use client';
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
import LogoutButton from '@/supacharger/components/buttons/logout-button';

const focusClasses = 'focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2';

export default function SCAccountMenu() {
  const username = 'jollyrogger';

  const { setTheme } = useTheme();

  const tAuthTerms = useTranslations('AuthTerms');
  const tAccountDropdownMenu = useTranslations('AccountDropdownMenu');
  const tThemeChangerMenu = useTranslations('ThemeChangerMenu');

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className={`flex items-center rounded-full ${focusClasses}`} aria-label={`User menu for ${username}`}>
          <div className='flex h-8 w-8 items-center justify-center rounded-full bg-primary'>
            <span className='text-sm font-bold text-white' aria-hidden='true'>
              JD
            </span>
          </div>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end' className='w-48'>
        <DropdownMenuLabel>@{username}</DropdownMenuLabel>
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
          <DropdownMenuItem asChild>
            <Link href={`/profile/${username}`} className='flex items-center gap-2 py-2 text-xs hover:cursor-pointer'>
              <User size={18} /> {tAccountDropdownMenu('myProfile')}
            </Link>
          </DropdownMenuItem>
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
        <DropdownMenuItem>
          <LogOut size={14} />
          <LogoutButton className='m-0 bg-transparent p-0 text-xs transition-colors'>
          {tAuthTerms('logOut')}
          </LogoutButton>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
