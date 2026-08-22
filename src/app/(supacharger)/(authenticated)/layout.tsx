import { PropsWithChildren } from 'react';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import SCFooterSession from '@/components/sc_demo/sc_footer-session';
import { SCHeaderSession } from '@/components/sc_demo/sc_header-session';
import { SC_CONFIG } from '@/supacharger/supacharger-config';

export const dynamic = 'force-dynamic';

const site_title = SC_CONFIG.SITE_TITLE;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('AuthenticatedMetadata');
  return { title: site_title, description: t('description') };
}

export default function RootLayout({ children }: PropsWithChildren) {
  return (
    <div className='m-auto flex h-full flex-col'>
      <SCHeaderSession />
      <main className='relative flex-1'>
        <div className='relative h-full'>
          {children}
        </div>
      </main>
      <SCFooterSession />
    </div>
  );
}
