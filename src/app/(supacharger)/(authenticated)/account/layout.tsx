import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import { accountSettingsLayoutMode } from '@/supacharger.adapters/account/presentation';
import { AccountSettingsShell } from '@/supacharger/account/settings/account-settings-shell';
import { SC_CONFIG } from '@/supacharger/supacharger-config';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('AccountSettings');
  return { title: `${SC_CONFIG.SITE_TITLE} | ${t('title')}`, description: t('description') };
}

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  if (accountSettingsLayoutMode === 'passthrough') return children;
  return <AccountSettingsShell>{children}</AccountSettingsShell>;
}
