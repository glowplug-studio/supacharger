import { PropsWithChildren } from 'react';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import { AccountLayout } from '@/app/(project)/(authenticated)/account/account-layout';
import { SC_CONFIG } from '@/supacharger/supacharger-config';

const siteTitle = SC_CONFIG.SITE_TITLE;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('AccountMetadata');
  return { title: `${siteTitle} | ${t('title')}`, description: t('description') };
}

export default function OnboardedAccountLayout({ children }: PropsWithChildren) {
  return <AccountLayout>{children}</AccountLayout>;
}
