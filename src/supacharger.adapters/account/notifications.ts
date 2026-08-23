import { getTranslations } from 'next-intl/server';

import type { PreferenceSurface, PreferenceValues } from '@/supacharger/account/preferences/preference-contract';

export async function loadNotificationPreferences(_userId: string): Promise<PreferenceSurface> {
  const t = await getTranslations('AccountPreferences.notifications');
  return { availability: 'disabled', title: t('title'), description: t('description'), disabledMessage: t('disabled'), options: [] };
}

export async function updateNotificationPreferences(_userId: string, _values: PreferenceValues): Promise<void> {
  throw new Error('Notification persistence is not configured.');
}
