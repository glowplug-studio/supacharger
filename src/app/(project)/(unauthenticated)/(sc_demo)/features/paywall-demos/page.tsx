import { Suspense } from 'react';

import SCFooter from '@/components/sc_demo/sc_footer';
import { createMarketingPageMetadata } from '@/components/sc_demo/sc_marketing_metadata';
import SCMarketingStructuredData from '@/components/sc_demo/sc_marketing_structured_data';
import { SCPaywallDemos } from '@/components/sc_demo/sc_marketing-feature-pages';

export async function generateMetadata() { return createMarketingPageMetadata('paywallDemos'); }

export default function PaywallDemosPage() {
  return (
    <>
      <SCMarketingStructuredData pageName='paywallDemos' />
      <Suspense fallback={null}>
        <SCPaywallDemos />
      </Suspense>
      <Suspense fallback={null}>
        <SCFooter />
      </Suspense>
    </>
  );
}
