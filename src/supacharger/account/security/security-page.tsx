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
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user?.email) redirect('/account/login');

  const providerKeys = Array.from(new Set([
    typeof user.app_metadata.provider === 'string' ? user.app_metadata.provider : null,
    ...(user.identities ?? []).map((identity) => identity.provider),
  ].filter((provider): provider is string => Boolean(provider))));
  const hasPasswordIdentity = providerKeys.includes('email');

  return (
    <div className='space-y-6' data-sc-account-security>
      <SecurityForms
        email={user.email}
        hasPasswordIdentity={hasPasswordIdentity}
        providers={providerKeys.map(formatProvider)}
      />
      {SC_CONFIG.AUTHENTICATION.MFA_TOTP.ENABLED ? <TotpPanel /> : null}
    </div>
  );
}
