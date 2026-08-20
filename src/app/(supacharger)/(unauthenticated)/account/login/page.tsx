import { redirect } from 'next/navigation';

import { AuthEntry } from '@/supacharger/components/forms/auth-entry';

interface SignInPageProps {
  searchParams?: Promise<{ mode?: string }>;
}

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const params = await searchParams;
  if (params?.mode === 'signup') redirect('/account/create');

  return (
    <main id='sc_login-page' className='w-full max-w-md'>
      <AuthEntry initialMode='signin' />
    </main>
  );
}
