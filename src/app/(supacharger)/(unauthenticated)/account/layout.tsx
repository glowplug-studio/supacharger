import { PropsWithChildren } from 'react';
import type { Metadata } from 'next';
import SCAccountLoginLeft from '@/components/sc_demo/sc_account-login-left';
import { SC_CONFIG } from '@/supacharger/supacharger-config';

export const metadata: Metadata = {
  title: SC_CONFIG.SITE_TITLE,
  description: 'Start your next project without reinventing the wheel. REPLACE_ME',
};

export default async function RootLayout({ children }: PropsWithChildren) {
  return (
    <div id='account-unauthed-layout' className='auth-panel-background flex min-h-screen'>
      <SCAccountLoginLeft />
      <div className='auth-panel-background flex min-h-screen w-full flex-1 items-center justify-center px-4 py-10 sm:px-6 lg:px-12'>
        {children}
      </div>
    </div>
  );
}
