'use client';
import  SCSiteLogo from '@/components/sc_demo/sc_site-logo';
import { LoginMagicLinkUI } from '@/supacharger/components/forms/login-magic-link-ui';

export default function AuthMagicLink() {
  return (
    <>
      <div className='flex min-h-full flex-1 flex-col justify-center px-6 py-12 lg:px-8'>
        <div className='mt-10 sm:mx-auto sm:w-full sm:max-w-sm'>
          <section className='py-xl m-auto flex h-full max-w-lg items-center'>
            <div className='flex flex-col gap-4'>
              <SCSiteLogo showSiteTitle={true} darkMode={true}></SCSiteLogo>
            </div>
            <LoginMagicLinkUI />
          </section>
        </div>
      </div>
    </>
  );
}
