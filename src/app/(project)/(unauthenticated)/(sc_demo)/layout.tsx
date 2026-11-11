import { PropsWithChildren } from 'react';

import { SCMarketingMenu } from '@/components/sc_demo/sc_header-marketing';

export default async function RootLayout({ children }: PropsWithChildren) {
  return (
    <div
      id='marketing-root-layout'
      className='[&_button]:rounded-lg [&_input]:rounded-lg [&_select]:rounded-lg [&_textarea]:rounded-lg'
    >
      <div id='sc-persistent-marketing-header'>
        <SCMarketingMenu />
      </div>
      <main className='relative flex-1'>
        <div className='relative h-full'>{children}</div>
      </main>
    </div>
  );
}
