import { PropsWithChildren } from 'react';

import { AuthenticatedAppShell } from '@/app/(project)/authenticated-app-shell';
import { requireVerifiedUser } from '@/supacharger/auth/server-access';

export const dynamic = 'force-dynamic';

export default async function VerifiedLayout({ children }: PropsWithChildren) {
  await requireVerifiedUser();

  return <AuthenticatedAppShell>{children}</AuthenticatedAppShell>;
}
