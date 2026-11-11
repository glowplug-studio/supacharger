import { Suspense } from 'react';

import { SCCoreWidgetDemos } from '@/components/sc_demo/sc_core-widget-demos';
import { SCDeveloperToolingDemo } from '@/components/sc_demo/sc_developer-tooling-demo';
import SCFooter from '@/components/sc_demo/sc_footer';
import { createMarketingPageMetadata } from '@/components/sc_demo/sc_marketing_metadata';
import SCMarketingStructuredData from '@/components/sc_demo/sc_marketing_structured_data';

export async function generateMetadata() {
  return createMarketingPageMetadata('coreWidgetDemos');
}

export default function CoreWidgetDemosPage() {
  return (
    <>
      <SCMarketingStructuredData pageName='coreWidgetDemos' />
      <SCCoreWidgetDemos developerTools={<SCDeveloperToolingDemo />} />
      <Suspense fallback={null}>
        <SCFooter />
      </Suspense>
    </>
  );
}
