import { notFound } from 'next/navigation';

import { PersonalInvoicesPage } from '@/supacharger/billing/personal-invoices-page';
import { SC_CONFIG } from '@/supacharger/supacharger-config';

export const instant = false;

export default function BillingInvoicesPage() {
  if (!SC_CONFIG.BILLING.ACCOUNT_SUBJECTS.PERSONAL) notFound();
  return <PersonalInvoicesPage />;
}
