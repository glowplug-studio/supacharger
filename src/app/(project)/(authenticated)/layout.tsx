import { PropsWithChildren } from 'react';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import { AuthenticatedAppShell } from '@/app/(project)/authenticated-app-shell';
import { requireAppAccess } from '@/supacharger/auth/server-access';

export async function generateMetadata(): Promise<Metadata> {
  const global = await getTranslations('Global');
  const t = await getTranslations('AuthenticatedMetadata');
  return { title: { absolute: global('siteTitle') }, description: t('description') };
}

export default async function RootLayout({ children }: PropsWithChildren) {
  await requireAppAccess();

  return <AuthenticatedAppShell>{children}</AuthenticatedAppShell>;
}
