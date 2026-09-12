import { permanentRedirect } from 'next/navigation';

export default function LegacyPaywallDemosPage() {
  permanentRedirect('/features/paywall-demos');
}
