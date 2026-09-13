import Link from 'next/link';
import { getTranslations } from 'next-intl/server';

import { SupachargerAuthShell } from '@/supacharger/components/auth/auth-shell';

export const instant = false;

export default async function AuthErrorPage({ searchParams }: {
  searchParams: Promise<{ flow?: string }>;
}) {
  const isRecovery = (await searchParams).flow === 'recovery';
  const [tError, tAuthTerms] = await Promise.all([
    getTranslations('ErrorPage'),
    getTranslations('AuthTerms'),
  ]);

  return (
    <SupachargerAuthShell>
      <main id='sc_auth-error-page' className='sc-auth-page sc-auth-error-page' data-sc-auth-page='error'>
        <p className='sc-auth-error-status'>{tError('unexpected.status')}</p>
        <h1 className='sc-auth-page-title'>{tError(isRecovery ? 'recovery.title' : 'unexpected.title')}</h1>
        <p className='sc-auth-error-description'>{tError(isRecovery ? 'recovery.description' : 'unexpected.description')}</p>
        <Link className='sc-auth-primary-button sc-auth-error-action' href={isRecovery ? '/account/reset-password' : '/account/login'}>
          {isRecovery ? tError('recovery.action') : tAuthTerms('backToSignIn')}
        </Link>
      </main>
    </SupachargerAuthShell>
  );
}
