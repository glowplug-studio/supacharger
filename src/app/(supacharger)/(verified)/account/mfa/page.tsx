import { redirect } from 'next/navigation';

import { MfaChallengeForm } from '@/supacharger/account/security/mfa-challenge-form';
import { getSafeNextPath } from '@/supacharger/auth/safe-next-path';
import { requireVerifiedUser } from '@/supacharger/auth/server-access';
import { SC_CONFIG } from '@/supacharger/supacharger-config';

export const instant = false;

export default async function AccountMfaPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  await requireVerifiedUser();
  if (!SC_CONFIG.AUTHENTICATION.MFA_TOTP.REQUIRED_FOR_SIGN_IN) {
    redirect(SC_CONFIG.USER_REDIRECTS.AUTHED_USER.LOGIN_REDIRECT_DESTINATION);
  }
  const query = await searchParams;
  return (
    <main className='sc-account-mfa-page'>
      <MfaChallengeForm nextPath={getSafeNextPath(query.next)} />
    </main>
  );
}
