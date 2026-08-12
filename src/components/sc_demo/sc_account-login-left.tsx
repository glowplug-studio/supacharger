import Link from 'next/link';

import SCSiteLogo from './sc_site-logo';

export default function SCAccountLoginLeft() {
  return (
    //@TODO handle session state - switch this href using values from src/supacharger.config.ts.
    <div
      className='relative hidden flex-1 flex-col bg-cover bg-center bg-no-repeat lg:flex'
      style={{
        backgroundImage: 'url(https://images.unsplash.com/photo-1599148401005-fe6d7497cb5e?q=80&w=1964)',
      }}
    >
      <div className='absolute top-0 flex w-full justify-between gap-4 py-6 pl-8 pr-6 xl:pl-24 '>
        <div className='m-4 flex items-center gap-4 rounded-md bg-white dark:bg-slate-800 p-6'>
          <SCSiteLogo showSiteTitle={true} />
        </div>
      </div>
    </div>
  );
}
