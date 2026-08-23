import { accountSecurityPageOverride } from '@/supacharger.adapters/account/security-page';
import { SecurityPage } from '@/supacharger/account/security/security-page';

export default async function AccountSecurityPage() {
  return accountSecurityPageOverride ? accountSecurityPageOverride() : <SecurityPage />;
}
