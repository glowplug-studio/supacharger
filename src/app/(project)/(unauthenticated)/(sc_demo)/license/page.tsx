import SCFooter from '@/components/sc_demo/sc_footer';
import SCLicensePage from '@/components/sc_demo/sc_license-page';
import { createMarketingPageMetadata } from '@/components/sc_demo/sc_marketing_metadata';

export async function generateMetadata() { return createMarketingPageMetadata('license'); }

export default function LicensePage() {
  return <><SCLicensePage /><SCFooter /></>;
}
