import SCFooter from '@/components/sc_demo/sc_footer';
import SCLegalPage from '@/components/sc_demo/sc_legal-page';
import { createMarketingPageMetadata } from '@/components/sc_demo/sc_marketing_metadata';

export async function generateMetadata() { return createMarketingPageMetadata('legal'); }

export default async function Legal() {
  return (
    <>
      <SCLegalPage></SCLegalPage>
      <SCFooter></SCFooter>
    </>
  );
}
