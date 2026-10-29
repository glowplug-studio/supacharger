import Link from 'next/link';
import { useTranslations } from 'next-intl';

import SiteLogoSVG from '@/assets/images/site-logo-light.svg';
import { cn } from '@/utils/cn';

interface LogoProps {
  showSiteTitle?: boolean | null;
  darkMode?: boolean | null;
  titleClassName?: string;
}

export default function SCSiteLogo({ showSiteTitle, darkMode, titleClassName }: LogoProps) {
  const global = useTranslations('Global');
  return (
    //@TODO handle session state - switch this href using values from src/supacharger.config.ts.
    <Link href='/' className='flex w-fit items-center gap-1.5 hover:no-underline'>
      <SiteLogoSVG className='size-[21px] shrink-0' />
      {showSiteTitle ? (
        <span
          className={cn(
            'text-[22px] leading-none font-semibold tracking-[-0.04em] transition-colors',
            darkMode === true
              ? 'text-white hover:text-white/80'
              : darkMode === false
                ? 'text-foreground hover:text-foreground/80'
                : 'text-foreground hover:text-foreground/80',
            titleClassName,
          )}
        >
          {global('siteTitle')}
        </span>
      ) : null}
    </Link>
  );
}
