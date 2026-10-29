import Link from 'next/link';
import { getTranslations } from 'next-intl/server';

import { SupachargerAuthShell } from '@/supacharger/components/auth/auth-shell';
import { OAuthErrorRecovery } from '@/supacharger/components/auth/oauth-error-recovery';

import englishMessages from '../../../../../../messages/en.json';

export const instant = false;

export default async function AuthErrorPage({ searchParams }: {
  searchParams: Promise<{ flow?: string; status?: string }>;
}) {
  const params = await searchParams;
  const isRecovery = params.flow === 'recovery';
  const isEmailChange = params.flow === 'email-change';
  const emailStatus = params.status === 'pending' || params.status === 'complete' ? params.status : 'invalid';
  const [tError, tAuthTerms, tEmailChange] = await Promise.all([
    getTranslations('ErrorPage'),
    getTranslations('AuthTerms'),
    getTranslations('EmailChangeResult'),
  ]);

  const emailText = (key: keyof typeof englishMessages.EmailChangeResult) =>
    tEmailChange.has(key) && tEmailChange(key) ? tEmailChange(key) : englishMessages.EmailChangeResult[key];

  const content = (
    <SupachargerAuthShell>
      <main id='sc_auth-error-page' className='sc-auth-page sc-auth-error-page' data-sc-auth-page='error'>
        {!isEmailChange ? <p className='sc-auth-error-status'>{tError('unexpected.status')}</p> : null}
        <h1 className='sc-auth-page-title'>{isEmailChange ? emailText(`${emailStatus}Title`) : tError(isRecovery ? 'recovery.title' : 'unexpected.title')}</h1>
        <p className='sc-auth-error-description'>{isEmailChange ? emailText(`${emailStatus}Description`) : tError(isRecovery ? 'recovery.description' : 'unexpected.description')}</p>
        <Link className='sc-auth-primary-button sc-auth-error-action' href={isRecovery ? '/account/reset-password' : '/account/login'}>
          {isRecovery ? tError('recovery.action') : tAuthTerms('backToSignIn')}
        </Link>
      </main>
    </SupachargerAuthShell>
  );

  return isRecovery || isEmailChange ? content : <OAuthErrorRecovery>{content}</OAuthErrorRecovery>;
}
