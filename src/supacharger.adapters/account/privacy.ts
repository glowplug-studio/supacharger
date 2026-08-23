import { getTranslations } from 'next-intl/server';

import type { PreferenceSurface, PreferenceValues } from '@/supacharger/account/preferences/preference-contract';

export async function loadPrivacyPreferences(_userId: string): Promise<PreferenceSurface> {
  const t = await getTranslations('AccountPreferences.privacy');
  return { availability: 'disabled', title: t('title'), description: t('description'), disabledMessage: t('disabled'), options: [] };
}

export async function updatePrivacyPreferences(_userId: string, _values: PreferenceValues): Promise<void> {
  throw new Error('Privacy persistence is not configured.');
}
