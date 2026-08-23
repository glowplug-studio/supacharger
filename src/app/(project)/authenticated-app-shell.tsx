import { PropsWithChildren } from 'react';

import SCFooterSession from '@/components/sc_demo/sc_footer-session';
import { SCHeaderSession } from '@/components/sc_demo/sc_header-session';

export function AuthenticatedAppShell({ children }: PropsWithChildren) {
  return (
    <div className='m-auto flex min-h-svh flex-col'>
      <SCHeaderSession />
      <main className='relative flex-1'>
        <div className='relative h-full'>{children}</div>
      </main>
      <SCFooterSession />
    </div>
  );
}
