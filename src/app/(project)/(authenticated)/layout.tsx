import { PropsWithChildren } from 'react';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import { AuthenticatedAppShell } from '@/app/(project)/authenticated-app-shell';
import { requireAppAccess } from '@/supacharger/auth/server-access';
import { SC_CONFIG } from '@/supacharger/supacharger-config';

const site_title = SC_CONFIG.SITE_TITLE;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('AuthenticatedMetadata');
  return { title: site_title, description: t('description') };
}

export default async function RootLayout({ children }: PropsWithChildren) {
  await requireAppAccess();

  return <AuthenticatedAppShell>{children}</AuthenticatedAppShell>;
}
