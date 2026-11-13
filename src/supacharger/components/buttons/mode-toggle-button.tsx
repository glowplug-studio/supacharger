'use client';

import { useSyncExternalStore } from 'react';
import { useTranslations } from 'next-intl';
import { useTheme } from 'next-themes';
import { MonitorCog, Moon, Sun } from 'lucide-react';

import { Button } from '@/supacharger/components/primitives/button';
import { cn } from '@/utils/cn';
import { Menu } from '@base-ui/react/menu';
import { Toggle } from '@base-ui/react/toggle';
import { ToggleGroup } from '@base-ui/react/toggle-group';

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
    <Menu.Root>
      <Menu.Trigger
        render={
          <Button
            aria-label={tThemeChangerMenu('title')}
            className={cn(
              appearance === 'default' && 'relative bg-white dark:bg-slate-800',
              appearance === 'marketing' &&
                'border-border text-foreground hover:bg-accent hover:text-foreground inline-flex h-auto items-center justify-center gap-2 rounded-lg border bg-transparent px-5 py-3 text-sm font-medium whitespace-nowrap shadow-none transition-colors focus-visible:ring-1 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 dark:border-neutral-800 dark:bg-neutral-950 dark:hover:bg-neutral-800 dark:hover:text-neutral-50 dark:focus-visible:ring-neutral-300 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
              className,
            )}
            size={appearance === 'marketing' ? 'sm' : 'icon'}
            variant='outline'
          >
            <CurrentIcon aria-hidden='true' />
            {appearance === 'marketing' ? <span>{tThemeChangerMenu(currentTheme)}</span> : null}
          </Button>
        }
      />
      <Menu.Portal>
        <Menu.Positioner sideOffset={4} className='isolate z-50' align={appearance === 'marketing' ? 'start' : 'end'}>
          <Menu.Popup
            className={cn(
              'w-[17rem] rounded-sm border border-neutral-200 bg-white p-2 text-neutral-950 shadow-md dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-50',
              appearance === 'marketing' && 'border-border bg-popover text-popover-foreground shadow-xl',
            )}
          >
            <Menu.Group>
              <Menu.GroupLabel className='text-muted-foreground px-1.5 pt-1 pb-2 text-xs font-medium'>
                {tThemeChangerMenu('title')}
              </Menu.GroupLabel>
            </Menu.Group>
            <ToggleGroup
              aria-label={tThemeChangerMenu('title')}
              className='border-border bg-muted grid grid-cols-3 gap-1 rounded-sm border p-1'
              onValueChange={([value]) => {
                if (value === 'system' || value === 'light' || value === 'dark') setTheme(value);
              }}
              value={[currentTheme]}
            >
              {themeChoices.map(({ icon: Icon, value }) => (
                <Toggle
                  aria-label={tThemeChangerMenu(value)}
                  className='text-muted-foreground hover:bg-background hover:text-foreground data-pressed:bg-background data-pressed:text-foreground inline-flex h-14 min-w-0 flex-col items-center justify-center gap-1 rounded-sm px-2 text-sm text-xs font-medium data-pressed:shadow-sm [&_svg]:size-4'
                  key={value}
                  value={value}
                >
                  <Icon aria-hidden='true' />
                  <span>{tThemeChangerMenu(value)}</span>
                </Toggle>
              ))}
            </ToggleGroup>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}
