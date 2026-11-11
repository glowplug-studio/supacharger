import SCFooter from '@/components/sc_demo/sc_footer';
import SCFooterSession from '@/components/sc_demo/sc_footer-session';
import { SCHeaderSession } from '@/components/sc_demo/sc_header-session';
import { createMarketingPageMetadata } from '@/components/sc_demo/sc_marketing_metadata';
import SCMarketingStructuredData from '@/components/sc_demo/sc_marketing_structured_data';
import SCMarketingLanding from '@/components/sc_demo/sc_marketing-landing';
import SCUserDash from '@/components/sc_demo/sc_user-dash';
import { isLoggedIn } from '@/lib/supabase/supacharger/supabase-auth';

// This page selects its product body from the request-time auth cookie.
export const instant = false;

export async function generateMetadata() {
  return createMarketingPageMetadata('home');
}

export default async function RootPage() {
  const session = await isLoggedIn();

  return (
    <>
      <SCMarketingStructuredData pageName='home' />
      {session ? (
        <>
          <style>{`#sc-persistent-marketing-header { display: none; }`}</style>
          <SCHeaderSession />
          <SCUserDash />
          <SCFooterSession />
        </>
      ) : (
        <>
          <SCMarketingLanding />
          <SCFooter />
        </>
      )}
    </>
  );
}
