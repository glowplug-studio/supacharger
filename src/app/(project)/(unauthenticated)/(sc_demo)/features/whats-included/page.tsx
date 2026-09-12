import SCFooter from '@/components/sc_demo/sc_footer';
import { createMarketingPageMetadata } from '@/components/sc_demo/sc_marketing_metadata';
import { SCWhatsIncluded } from '@/components/sc_demo/sc_marketing-feature-pages';

export async function generateMetadata() {
  return createMarketingPageMetadata('whatsIncluded');
}

export default function WhatsIncludedPage() {
  return (
    <>
      <SCWhatsIncluded />
      <Suspense fallback={null}>
        <SCFooter />
      </Suspense>
    </>
  );
}
import { Suspense } from 'react';
