import { PropsWithChildren } from 'react';
import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { useTranslations } from 'next-intl';

import { AccountLayout } from  '@/app/(supacharger)/(authenticated)/account/account-layout';
import { SC_CONFIG } from '@/supacharger/supacharger-config';

export const dynamic = 'force-dynamic';

const site_title = SC_CONFIG.SITE_TITLE;

//const tPageMeta = useTranslations('PageMeta');
// @todo fix these page titles so they load from intl

export const metadata: Metadata = {
  title: site_title,//+ tPageMeta("accountAccountSecuritySettingsSectionTitle"),
  description: 'Start your next project without reinventing the wheel. REPLACE_ME',
};

export default async function RootLayout({ children }: PropsWithChildren) {
  // Get the current locale from cookies
  const cookieStore = await cookies();
  const currentLocale = cookieStore.get('supacharger_locale')?.value || 'en'; // Default to 'en' if not set
  // Load translations for the current locale
  const messages = await import(`../../../../../messages/${currentLocale}.json`).then((module) => module.default);

  return (
    <div className='m-auto flex h-full flex-col'>
      <main className='relative flex-1'>
        <div className='relative h-full'>
        <AccountLayout>{children}</AccountLayout>
        </div>
      </main>
    </div>
  );
}