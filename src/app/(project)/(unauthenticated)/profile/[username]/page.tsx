import { notFound } from 'next/navigation';

import SCProfilePage from "@/components/sc_demo/sc_profile-page";
import { SC_CONFIG } from '@/supacharger/supacharger-config';

export default function UserPage() {
  if (SC_CONFIG.PROFILE_IDENTITY.USERNAME === 'disabled') notFound();

  // Use the username parameter
  return (
    <>
    <SCProfilePage></SCProfilePage>
    </>
  );
}
