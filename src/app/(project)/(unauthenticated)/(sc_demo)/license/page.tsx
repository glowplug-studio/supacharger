import { Suspense } from 'react';

import SCFooter from '@/components/sc_demo/sc_footer';
import SCLicensePage from '@/components/sc_demo/sc_license-page';
import { createMarketingPageMetadata } from '@/components/sc_demo/sc_marketing_metadata';
import SCMarketingStructuredData from '@/components/sc_demo/sc_marketing_structured_data';

export async function generateMetadata() { return createMarketingPageMetadata('license'); }

export default function LicensePage() {
  return (
    <>
      <SCMarketingStructuredData pageName='license' />
      <Suspense fallback={null}>
        <SCLicensePage />
      </Suspense>
      <Suspense fallback={null}>
        <SCFooter />
      </Suspense>
    </>
  );
}
