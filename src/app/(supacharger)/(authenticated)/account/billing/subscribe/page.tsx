import { notFound } from 'next/navigation';

import { PersonalBillingAcquisition } from '@/supacharger.adapters/billing/acquisition';
import { requireOnboardedUser } from '@/supacharger/auth/server-access';
import { SC_CONFIG } from '@/supacharger/supacharger-config';

export default async function BillingSubscribePage() {
  if (!SC_CONFIG.BILLING.ACCOUNT_SUBJECTS.PERSONAL) notFound();
  await requireOnboardedUser();
  return <PersonalBillingAcquisition />;
}
