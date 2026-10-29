import { PropsWithChildren } from 'react';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import { AccountLayout } from '@/app/(project)/(authenticated)/account/account-layout';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('AccountMetadata');
  return { title: t('title'), description: t('description') };
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
