import { redirect } from 'next/navigation';

import { getSafeNextPath, withNextPath } from '@/supacharger/auth/safe-next-path';
import { AuthEntry } from '@/supacharger/components/forms/auth-entry';

interface SignInPageProps {
  searchParams?: Promise<{ mode?: string; next?: string }>;
}

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const params = await searchParams;
  const nextPath = getSafeNextPath(params?.next);
  if (params?.mode === 'signup') redirect(withNextPath('/account/create', nextPath));

  return (
    <main id='sc_login-page' className='w-full max-w-md'>
      <AuthEntry initialMode='signin' nextPath={nextPath} />
    </main>
  );
}
