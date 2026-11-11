import { Suspense } from 'react';

import SCFooter from '@/components/sc_demo/sc_footer';
import { createMarketingPageMetadata } from '@/components/sc_demo/sc_marketing_metadata';
import SCMarketingStructuredData from '@/components/sc_demo/sc_marketing_structured_data';
import { SCWhatsIncluded } from '@/components/sc_demo/sc_marketing-feature-pages';

export async function generateMetadata() {
  return createMarketingPageMetadata('whatsIncluded');
}

export default function WhatsIncludedPage() {
  return (
    <>
      <SCMarketingStructuredData pageName='whatsIncluded' />
      <SCWhatsIncluded />
      <Suspense fallback={null}>
        <SCFooter />
      </Suspense>
    </>
  );
}
