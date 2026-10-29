import { PropsWithChildren } from 'react';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import { AccountLayout } from '@/app/(project)/(authenticated)/account/account-layout';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('AccountMetadata');
  return { title: t('title'), description: t('description') };
}

export default function OnboardedAccountLayout({ children }: PropsWithChildren) {
  return <AccountLayout>{children}</AccountLayout>;
}
