import { Suspense } from 'react';

import SCFooter from '@/components/sc_demo/sc_footer';
import SCLegalPage from '@/components/sc_demo/sc_legal-page';
import { createMarketingPageMetadata } from '@/components/sc_demo/sc_marketing_metadata';
import SCMarketingStructuredData from '@/components/sc_demo/sc_marketing_structured_data';

export async function generateMetadata() { return createMarketingPageMetadata('legal'); }

export default function Legal() {
  return (
    <>
      <SCMarketingStructuredData pageName='legal' />
      <Suspense fallback={null}>
        <SCLegalPage />
      </Suspense>
      <Suspense fallback={null}>
        <SCFooter />
      </Suspense>
    </>
  );
}
