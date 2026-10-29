import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import { AccountChrome } from '@/supacharger.adapters/account/chrome';
import { accountSettingsLayoutMode } from '@/supacharger.adapters/account/presentation';
import { AccountSettingsShell } from '@/supacharger/account/settings/account-settings-shell';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('AccountSettings');
  return { title: t('title'), description: t('description') };
}

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  if (accountSettingsLayoutMode === 'passthrough') return children;
  return (
    <AccountChrome>
      <AccountSettingsShell>{children}</AccountSettingsShell>
    </AccountChrome>
  );
}
