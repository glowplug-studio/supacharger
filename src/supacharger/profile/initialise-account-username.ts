import { prefixes, suffixes } from '@/supacharger.adapters/profile/username-words';
import type { AuthCallbackContext } from '@/supacharger/auth/callback-adapter-contract';
import { schemaName } from '@/supacharger/namespace';
import { SC_CONFIG } from '@/supacharger/supacharger-config';
import { generateUsername } from '@/supacharger/utils/generate-username';

import 'server-only';

/** Persist an available default once; disabled usernames remain untouched. */
export async function initialiseAccountUsername(supabase: AuthCallbackContext['supabase']) {
  if (SC_CONFIG.PROFILE_IDENTITY.USERNAME === 'disabled') return;
  try {
    const { error } = await supabase.schema(schemaName('api')).rpc('initialise_account_username_by_current_user', {
      fallback_username: generateUsername({ prefixes, suffixes }),
    });
    if (error) throw error;
  } catch {
    // Existing completion checks still require a username when configured.
    console.warn('Username initialisation did not complete; existing profile rules still apply.');
  }
}
