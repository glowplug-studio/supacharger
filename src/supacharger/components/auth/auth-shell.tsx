import type { PropsWithChildren } from 'react';

import { AuthMobileBrand, AuthSidecar } from '@/supacharger.adapters/auth/auth-sidecar';

export function SupachargerAuthShell({ children }: PropsWithChildren) {
  return (
    <div id='account-unauthed-layout' className='sc-auth-shell' data-sc-auth-shell>
      <aside className='sc-auth-sidecar' data-sc-auth-sidecar>
        <AuthSidecar />
      </aside>
      <section className='sc-auth-panel' data-sc-auth-panel>
        <div className='sc-auth-mobile-brand' data-sc-auth-mobile-brand>
          <AuthMobileBrand />
        </div>
        {children}
      </section>
    </div>
  );
}
