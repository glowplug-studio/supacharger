import { notFound } from 'next/navigation';

import { PersonalBillingAcquisition } from '@/supacharger.adapters/billing/acquisition';
import { requireOnboardedUser } from '@/supacharger/auth/server-access';
import { BillingTabs } from '@/supacharger/billing/billing-tabs';
import { SC_CONFIG } from '@/supacharger/supacharger-config';

export const instant = false;

export default async function BillingUpgradePage() {
  if (!SC_CONFIG.BILLING.ACCOUNT_SUBJECTS.PERSONAL) notFound();
  await requireOnboardedUser();
  return <div className='space-y-6'><BillingTabs active='upgrade' /><PersonalBillingAcquisition /></div>;
}
