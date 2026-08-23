import { PropsWithChildren } from 'react';
import type { Metadata } from 'next';

import { SupachargerAuthShell } from '@/supacharger/components/auth/auth-shell';
import { SC_CONFIG } from '@/supacharger/supacharger-config';

export const metadata: Metadata = {
  title: SC_CONFIG.SITE_TITLE,
  description: SC_CONFIG.SITE_DESCRIPTION,
};

export default async function RootLayout({ children }: PropsWithChildren) {
  return <SupachargerAuthShell>{children}</SupachargerAuthShell>;
}
