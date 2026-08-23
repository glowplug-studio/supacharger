'use client';

import { LoginMagicLinkUI } from '@/supacharger/components/forms/login-magic-link-ui';

export default function AuthMagicLink() {
  return (
    <main id='sc_account-magic-link-page' className='sc-auth-page' data-sc-auth-page='magic-link'>
      <LoginMagicLinkUI />
    </main>
  );
}
