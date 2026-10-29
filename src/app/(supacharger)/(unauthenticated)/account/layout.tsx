import { PropsWithChildren } from 'react';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import { SupachargerAuthShell } from '@/supacharger/components/auth/auth-shell';

export async function generateMetadata(): Promise<Metadata> {
  const global = await getTranslations('Global');
  return {
    title: { absolute: global('siteTitle') },
    description: global('siteDescription'),
  };
}

export default async function RootLayout({ children }: PropsWithChildren) {
  return <SupachargerAuthShell>{children}</SupachargerAuthShell>;
}
