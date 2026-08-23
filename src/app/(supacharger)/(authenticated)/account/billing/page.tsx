import { PersonalBillingPage } from '@/supacharger/billing/personal-billing-page';

export default async function BillingPage({ searchParams }: {
  searchParams: Promise<{ portal?: string }>;
}) {
  const query = await searchParams;
  return <PersonalBillingPage portalError={query.portal === 'error'} />;
}
