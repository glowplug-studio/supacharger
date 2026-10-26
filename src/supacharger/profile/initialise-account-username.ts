import type { AuthCallbackContext } from '@/supacharger/auth/callback-adapter-contract';
import { SC_CONFIG } from '@/supacharger/supacharger-config';

import 'server-only';

/** Persist an available default once; disabled usernames remain untouched. */
export async function initialiseAccountUsername(supabase: AuthCallbackContext['supabase']) {
  if (SC_CONFIG.PROFILE_IDENTITY.USERNAME === 'disabled') return;
  try {
    const { error } = await supabase.schema('api').rpc('initialise_account_username_by_current_user');
    if (error) throw error;
  } catch {
    // Existing completion checks still require a username when configured.
    console.warn('Username initialisation did not complete; existing profile rules still apply.');
  }
}
