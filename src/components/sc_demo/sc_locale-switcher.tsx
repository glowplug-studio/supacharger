'use client';

import { useEffect, useState } from 'react';
import { Check, Globe } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { type AppLocale, DEFAULT_LOCALE, resolveLocale } from '@/i18n/config';
import { cn } from '@/utils/cn';

interface LocaleSwitcherProps {
  appearance?: 'default' | 'marketing';
  className?: string;
}

export default function LocaleSwitcher({ appearance = 'default', className }: LocaleSwitcherProps) {
  const handleLocaleChange = async (locale: AppLocale) => {
    const response = await fetch('/api/intl', {
      body: JSON.stringify({ locale }),
      headers: { 'Content-Type': 'application/json' },
      method: 'POST',
    });

    if (response.ok) window.location.reload();
  };

  const [locale, setLocale] = useState<AppLocale>(DEFAULT_LOCALE);

  useEffect(() => {
    fetch('/api/intl')
      .then((res) => res.json())
      .then((data) => setLocale(resolveLocale(data.locale)));
  }, []);

  const currentLocale = locale;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          aria-label='Change language'
          className={cn(
            'gap-2',
            appearance === 'marketing' &&
              'h-auto rounded-sm border-white/15 bg-transparent px-5 py-3 text-sm text-white shadow-none hover:bg-white/10 hover:text-white',
            className,
          )}
          size='sm'
          variant='outline'
        >
          <Globe aria-hidden='true' />
          {currentLocale.toUpperCase()}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align='end'
        className={cn(
          appearance === 'marketing' && 'rounded-sm border-white/10 bg-[#151716] text-white shadow-2xl shadow-black/30',
        )}
      >
        <DropdownMenuItem onClick={() => handleLocaleChange('en')}>
          <span className='flex-1'>English</span>
          {currentLocale === 'en' ? <Check aria-hidden='true' /> : null}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleLocaleChange('fr')}>
          <span className='flex-1'>Français</span>
          {currentLocale === 'fr' ? <Check aria-hidden='true' /> : null}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
