'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Check } from 'lucide-react';
import { toast } from 'react-toastify';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { type AppLocale, resolveLocale } from '@/i18n/config';
import { SC_CONFIG } from '@/supacharger/supacharger-config';
import { cn } from '@/utils/cn';

interface LocaleSwitcherProps {
  appearance?: 'default' | 'marketing';
  className?: string;
}

export default function LocaleSwitcher({ appearance = 'default', className }: LocaleSwitcherProps) {
  const t = useTranslations('LocaleSwitcher');
  const requestLocale = resolveLocale(useLocale());
  const [pendingLocale, setPendingLocale] = useState<AppLocale | null>(null);

  const handleLocaleChange = async (locale: AppLocale) => {
    if (locale === requestLocale || pendingLocale) return;

    setPendingLocale(locale);

    try {
      const response = await fetch('/api/intl', {
        body: JSON.stringify({ locale }),
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
      });

      if (!response.ok) throw new Error('Unable to change locale');
      window.location.reload();
    } catch {
      setPendingLocale(null);
      toast.error(t('changeFailed'), SC_CONFIG.TOAST_CONFIG);
    }
  };

  const currentLocale = pendingLocale ?? requestLocale;
  const localeOptions: { flag: string; label: string; value: AppLocale }[] = [
    { flag: '🇬🇧', label: t('english'), value: 'en' },
    { flag: '🇪🇸', label: t('spanish'), value: 'es' },
    { flag: '🇨🇳', label: t('chinese'), value: 'zh' },
  ];
  const currentOption = localeOptions.find(({ value }) => value === currentLocale) ?? localeOptions[0];

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button
          aria-label={t('changeLanguage')}
          className={cn(
            'gap-2',
            appearance === 'marketing' &&
              'border-border text-foreground hover:bg-accent hover:text-foreground h-auto rounded-sm bg-transparent px-5 py-3 text-sm shadow-none',
            className,
          )}
          size='sm'
          variant='outline'
          disabled={pendingLocale !== null}
        >
          <span aria-hidden='true'>{currentOption.flag}</span>
          {currentLocale.toUpperCase()}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align='end'
        className={cn(
          appearance === 'marketing' && 'border-border bg-popover text-popover-foreground rounded-sm shadow-xl',
        )}
      >
        {localeOptions.map((option) => (
          <DropdownMenuItem
            disabled={pendingLocale !== null}
            key={option.value}
            onSelect={() => handleLocaleChange(option.value)}
          >
            <span aria-hidden='true'>{option.flag}</span>
            <span className='flex-1'>{option.label}</span>
            {currentLocale === option.value ? <Check aria-hidden='true' /> : null}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
