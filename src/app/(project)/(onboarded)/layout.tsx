import { PropsWithChildren } from 'react';

import { AuthenticatedAppShell } from '@/app/(project)/authenticated-app-shell';
import { requireOnboardedUser } from '@/supacharger/auth/server-access';

export const dynamic = 'force-dynamic';

export default async function OnboardedLayout({ children }: PropsWithChildren) {
  await requireOnboardedUser();

  return <AuthenticatedAppShell>{children}</AuthenticatedAppShell>;
}
