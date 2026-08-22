import { getSafeNextPath } from '@/supacharger/auth/safe-next-path';
import { AuthEntry } from '@/supacharger/components/forms/auth-entry';

type CreateAccountPageProps = {
  searchParams?: Promise<{ next?: string }>;
};

export default async function CreateAccountPage({ searchParams }: CreateAccountPageProps) {
  const params = await searchParams;
  const nextPath = getSafeNextPath(params?.next);

  return (
    <main id='sc_account-create-page' className='w-full max-w-md'>
      <AuthEntry initialMode='signup' nextPath={nextPath} />
    </main>
  );
}
