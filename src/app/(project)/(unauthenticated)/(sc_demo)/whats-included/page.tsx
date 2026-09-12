import { permanentRedirect } from 'next/navigation';

export default function LegacyWhatsIncludedPage() {
  permanentRedirect('/features/whats-included');
}
