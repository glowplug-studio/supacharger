import SCFooter from '@/components/sc_demo/sc_footer';
import SCFooterSession from '@/components/sc_demo/sc_footer-session';
import { SCMarketingMenu } from  "@/components/sc_demo/sc_header-marketing";
import { SCHeaderSession } from '@/components/sc_demo/sc_header-session';
import SCMarketngLanding from '@/components/sc_demo/sc_marketing-landing';
import SCUserDash from '@/components/sc_demo/sc_user-dash';
import { isLoggedIn } from '@/lib/supabase/supacharger/supabase-auth';

export default async function RootPage() {

  const session = await isLoggedIn();

  return (
<>
      {session ? (<>
        <SCHeaderSession />
        <SCUserDash></SCUserDash>
        <SCFooterSession />
        </>
      ) : (
        <>
          <SCMarketingMenu />
          <SCMarketngLanding></SCMarketngLanding>
          <SCFooter />
        </>
      )}
</>

  );

}

