'use client';

import { useEffect, useState } from 'react';
import { Globe } from 'lucide-react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import { Button } from '../ui/button';

export default function LocaleSwitcher() {
  const handleLocaleChange = (locale: string) => {
    document.cookie = `supacharger_locale=${locale}; path=/`;
    window.location.reload(); // Reload to apply new locale
  };

  const [locale, setLocale] = useState('en');

  useEffect(() => {
    fetch('/api/intl')
      .then((res) => res.json())
      .then((data) => setLocale(data.locale));
  }, []);

  const currentLocale = locale;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className='inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors 
      focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-neutral-950 disabled:pointer-events-none 
      disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 dark:focus-visible:ring-neutral-300 
      border border-neutral-200 hover:bg-neutral-100 hover:text-neutral-900 dark:border-gray-600 dark:hover:bg-neutral-800 
      dark:hover:text-neutral-50 h-9 px-3 bg-white dark:bg-slate-800'>

        <Globe size={16} className='inline-block' /> {currentLocale === 'en' ? 'EN' : 'FR'}

      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onClick={() => handleLocaleChange('en')}>
          <span className='mr-2'>&#x1F1EC;&#x1F1E7;</span> English
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleLocaleChange('fr')}>
          <span className='mr-2'>&#x1F1EB;&#x1F1F7;</span> Français
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
