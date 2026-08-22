import { PropsWithChildren } from 'react';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import { AccountLayout } from  '@/app/(project)/(authenticated)/account/account-layout';
import { SC_CONFIG } from '@/supacharger/supacharger-config';

export const dynamic = 'force-dynamic';

const site_title = SC_CONFIG.SITE_TITLE;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('AccountMetadata');
  return { title: `${site_title} | ${t('title')}`, description: t('description') };
}

export default async function RootLayout({ children }: PropsWithChildren) {
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
