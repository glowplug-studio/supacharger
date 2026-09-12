import { SCCoreWidgetDemos } from '@/components/sc_demo/sc_core-widget-demos';
import SCFooter from '@/components/sc_demo/sc_footer';
import { createMarketingPageMetadata } from '@/components/sc_demo/sc_marketing_metadata';

export async function generateMetadata() {
  return createMarketingPageMetadata('coreWidgetDemos');
}

export default function CoreWidgetDemosPage() {
  return (
    <>
      <SCCoreWidgetDemos />
      <Suspense fallback={null}>
        <SCFooter />
      </Suspense>
    </>
  );
}
import { Suspense } from 'react';
