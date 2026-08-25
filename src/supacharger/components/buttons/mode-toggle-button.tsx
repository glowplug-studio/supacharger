'use client';

import { useSyncExternalStore } from 'react';
import { useTranslations } from 'next-intl';
import { useTheme } from 'next-themes';
import { MonitorCog, Moon, Sun } from 'lucide-react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Button } from '@/supacharger/components/primitives/button';
import { cn } from '@/utils/cn';

type ThemeChoice = 'system' | 'light' | 'dark';

interface ModeToggleProps {
  appearance?: 'default' | 'marketing';
  className?: string;
}

const themeChoices = [
  { icon: MonitorCog, value: 'system' },
  { icon: Sun, value: 'light' },
  { icon: Moon, value: 'dark' },
] as const;

const subscribeToHydration = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

export default function ModeToggle({ appearance = 'default', className }: ModeToggleProps) {
  const { theme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(subscribeToHydration, getClientSnapshot, getServerSnapshot);
  const tThemeChangerMenu = useTranslations('ThemeChangerMenu');
  const currentTheme: ThemeChoice = mounted && (theme === 'light' || theme === 'dark') ? theme : 'system';
  const CurrentIcon = mounted
    ? (themeChoices.find(({ value }) => value === currentTheme)?.icon ?? MonitorCog)
    : MonitorCog;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          aria-label={tThemeChangerMenu('title')}
          className={cn(
            appearance === 'default' && 'relative bg-white dark:bg-slate-800',
            appearance === 'marketing' &&
              'border-border text-foreground hover:bg-accent hover:text-foreground inline-flex items-center justify-center whitespace-nowrap h-auto gap-2 rounded-sm border bg-transparent px-5 py-3 text-sm font-medium shadow-none transition-colors focus-visible:ring-1 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 dark:border-neutral-800 dark:bg-neutral-950 dark:hover:bg-neutral-800 dark:hover:text-neutral-50 dark:focus-visible:ring-neutral-300',
            className,
          )}
          size={appearance === 'marketing' ? 'sm' : 'icon'}
          variant='outline'
        >
          <CurrentIcon aria-hidden='true' />
          {appearance === 'marketing' ? <span>{tThemeChangerMenu(currentTheme)}</span> : null}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align={appearance === 'marketing' ? 'start' : 'end'}
        className={cn(
          'w-[17rem] rounded-sm p-2',
          appearance === 'marketing' && 'border-border bg-popover text-popover-foreground shadow-xl',
        )}
      >
        <DropdownMenuLabel className='text-muted-foreground px-1.5 pt-1 pb-2 text-xs font-medium'>
          {tThemeChangerMenu('title')}
        </DropdownMenuLabel>
        <ToggleGroup
          aria-label={tThemeChangerMenu('title')}
          className='border-border bg-muted grid grid-cols-3 gap-1 rounded-sm border p-1'
          onValueChange={(value) => {
            if (value === 'system' || value === 'light' || value === 'dark') setTheme(value);
          }}
          type='single'
          value={currentTheme}
        >
          {themeChoices.map(({ icon: Icon, value }) => (
            <ToggleGroupItem
              aria-label={tThemeChangerMenu(value)}
              className='text-muted-foreground hover:bg-background hover:text-foreground data-[state=on]:bg-background data-[state=on]:text-foreground h-14 min-w-0 flex-col gap-1 rounded-sm px-2 text-xs data-[state=on]:shadow-sm'
              key={value}
              value={value}
            >
              <Icon aria-hidden='true' />
              <span>{tThemeChangerMenu(value)}</span>
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
