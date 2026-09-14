import SCSiteLogo from './sc_site-logo';

export default function SCAccountLoginLeft() {
  return (
    //@TODO handle session state - switch this href using values from src/supacharger.config.ts.
    <div
      className='relative hidden flex-1 flex-col overflow-hidden bg-cover bg-center bg-no-repeat lg:flex'
      style={{
        backgroundImage: 'url(https://images.unsplash.com/photo-1599148401005-fe6d7497cb5e?q=80&w=1964)',
      }}
    >
      <div className='absolute inset-0 bg-[#080a09]/65' />
      <div className='absolute inset-0 bg-[radial-gradient(circle_at_18%_14%,rgba(0,163,80,0.24),transparent_42%)]' />

      <div className='relative flex h-16 w-full items-center px-4 sm:px-6 lg:px-8 xl:px-12'>
        <SCSiteLogo darkMode={true} showSiteTitle={true} />
      </div>

      <p className='relative mt-auto px-4 pb-6 text-xs text-white/75 sm:px-6 lg:px-8 xl:px-12'>
        Photo by{' '}
        <a
          className='underline underline-offset-2 hover:text-white'
          href='https://unsplash.com/@olenkasergienko?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText'
          rel='noreferrer'
          target='_blank'
        >
          Olena Bohovyk
        </a>{' '}
        on{' '}
        <a
          className='underline underline-offset-2 hover:text-white'
          href='https://unsplash.com/photos/green-fern-plant-in-close-up-photography-r0M9HrfJMBM?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText'
          rel='noreferrer'
          target='_blank'
        >
          Unsplash
        </a>
      </p>
    </div>
  );
}
