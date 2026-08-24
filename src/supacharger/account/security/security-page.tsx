import { redirect } from 'next/navigation';

import { createClient } from '@/lib/supabase/server';
import { SC_CONFIG } from '@/supacharger/supacharger-config';

import { SecurityForms } from './security-forms';
import { TotpPanel } from './totp-panel';

function formatProvider(provider: string) {
  if (provider === 'email') return 'Email and password';
  return provider.split(/[_-]+/).map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`).join(' ');
}

export async function SecurityPage() {
  const supabase = await createClient();
  const [{ data: { user }, error }, claimsResult] = await Promise.all([
    supabase.auth.getUser(),
    supabase.auth.getClaims(),
  ]);
  if (error || !user?.email) redirect('/account/login');

  const providerKeys = Array.from(new Set([
    typeof user.app_metadata.provider === 'string' ? user.app_metadata.provider : null,
    ...(user.identities ?? []).map((identity) => identity.provider),
  ].filter((provider): provider is string => Boolean(provider))));
  const hasPasswordIdentity = providerKeys.includes('email');
  const amr = Array.isArray(claimsResult.data?.claims.amr) ? claimsResult.data.claims.amr : [];
  const primaryMethod = [...amr]
    .reverse()
    .find((entry) => entry && typeof entry === 'object' && 'method' in entry && entry.method !== 'totp' && entry.method !== 'token_refresh');
  const currentMethod = primaryMethod && typeof primaryMethod === 'object' && 'method' in primaryMethod
    ? formatProvider(String(primaryMethod.method))
    : formatProvider(providerKeys[0] ?? 'unknown');

  return (
    <div className='sc-account-security' data-sc-account-security>
      <SecurityForms
        currentMethod={currentMethod}
        email={user.email}
        hasPasswordIdentity={hasPasswordIdentity}
        pendingEmail={user.new_email ?? null}
        providers={providerKeys.map(formatProvider)}
      />
      {SC_CONFIG.AUTHENTICATION.MFA_TOTP.ENABLED ? <TotpPanel /> : null}
    </div>
  );
}
