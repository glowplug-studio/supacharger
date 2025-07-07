import { PropsWithChildren } from 'react';
import type { Metadata } from 'next';
import { useTranslations } from 'next-intl';

import SCAccountLoginLeft from '@/components/sc_demo/sc_account-login-left';
import { SCMarketingMenu } from '@/components/sc_demo/sc_header-marketing';
import { SC_CONFIG } from '@/supacharger/supacharger-config';

export const metadata: Metadata = {
  title: SC_CONFIG.SITE_TITLE,
  description: 'Start your next project without reinventing the wheel. REPLACE_ME',
};

export default async function RootLayout({ children }: PropsWithChildren) {
  return (
    <div id='account-unauthed-layout'>
      <div className='flex min-h-screen w-full flex-col lg:flex-row'>
        {/* Left Side: Component is in the demo to be modified */}
        <SCAccountLoginLeft></SCAccountLoginLeft>

        <div className='flex w-full flex-1 flex-col items-center sm:justify-center px-4 lg:px-0'>
          <div className='flex w-full max-w-md flex-col gap-6 py-6 lg:py-20'>{children}</div>
        </div>
      </div>
    </div>
  );
}
