import type { PropsWithChildren } from 'react';

import { requireAppAccess } from '@/supacharger/auth/server-access';

export const dynamic = 'force-dynamic';

export default async function SidebarDemoLayout({ children }: PropsWithChildren) {
  await requireAppAccess();

  return children;
}
