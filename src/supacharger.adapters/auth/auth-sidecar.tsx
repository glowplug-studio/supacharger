import SCAccountLoginLeft from '@/components/sc_demo/sc_account-login-left';
import SCSiteLogo from '@/components/sc_demo/sc_site-logo';

export function AuthSidecar() {
  return <SCAccountLoginLeft />;
}

export function AuthMobileBrand() {
  return <SCSiteLogo showSiteTitle={true} darkMode={true} />;
}
