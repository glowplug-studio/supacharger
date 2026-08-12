import Link from 'next/link';

import SiteLogoSVG from '@/assets/images/SiteLogoSVG.svg';
import { SC_CONFIG } from '@/supacharger/supacharger-config';

interface LogoProps {
  showSiteTitle?: boolean | null;
  darkMode?: boolean | null;
}

export default function SCSiteLogo({ showSiteTitle, darkMode }: LogoProps) {
  return (
    //@TODO handle session state - switch this href using values from src/supacharger.config.ts.
    <Link href='/' className='flex w-fit items-center gap-2  hover:no-underline'>
      <SiteLogoSVG></SiteLogoSVG>
      {showSiteTitle ? (
        <span
          className={`text-xl font-semibold hover:text-gray-900 ${
            darkMode === true ? 'text-white' : darkMode === false ? 'text-gray-700' : 'text-gray-700 dark:text-white'
          }`}
        >
          {SC_CONFIG.SITE_TITLE}
        </span>
      ) : null}
    </Link>
  );
}
