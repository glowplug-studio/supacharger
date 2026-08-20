import Link from 'next/link';

import SiteLogoSVG from '@/assets/images/SiteLogoSVG.svg';
import { SC_CONFIG } from '@/supacharger/supacharger-config';
import { cn } from '@/utils/cn';

interface LogoProps {
  showSiteTitle?: boolean | null;
  darkMode?: boolean | null;
}

export default function SCSiteLogo({ showSiteTitle, darkMode }: LogoProps) {
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
                ? 'text-gray-700 hover:text-gray-900'
                : 'text-gray-700 hover:text-gray-900 dark:text-white dark:hover:text-white/80',
          )}
        >
          {SC_CONFIG.SITE_TITLE}
        </span>
      ) : null}
    </Link>
  );
}
