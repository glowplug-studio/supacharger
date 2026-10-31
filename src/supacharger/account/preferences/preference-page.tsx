import { redirect } from 'next/navigation';

import { createClient } from '@/lib/supabase/server';
import { loadNotificationPreferences } from '@/supacharger.adapters/account/notifications';
import { loadPrivacyPreferences } from '@/supacharger.adapters/account/privacy';
import { redirectIfServiceUnavailable } from '@/supacharger/auth/service-unavailable';

import type { PreferenceKind } from './preference-contract';
import { preferenceSurfaceSchema } from './preference-contract';
import { PreferenceForm } from './preference-form';

export async function PreferencePage({ kind }: { kind: PreferenceKind }) {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  redirectIfServiceUnavailable(error, '/account');
  if (error || !user || user.is_anonymous) redirect('/account/login');
  const loaded = kind === 'privacy' ? await loadPrivacyPreferences(user.id) : await loadNotificationPreferences(user.id);
  const parsed = preferenceSurfaceSchema.safeParse(loaded);
  if (!parsed.success) throw new Error(`The ${kind} preference adapter returned an invalid descriptor.`);
  return <PreferenceForm kind={kind} surface={parsed.data} />;
}
