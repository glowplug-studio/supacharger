import type { Database } from '@/lib/supabase/types';
import type { AuthError, SupabaseClient } from '@supabase/supabase-js';

export type AuthCallbackContext = {
  code: string | null;
  nextPath: string | null;
  requestUrl: URL;
  supabase: SupabaseClient<Database>;
};

export type AuthCallbackFailureContext = AuthCallbackContext & {
  error?: AuthError;
  reason: 'exchange-error' | 'missing-code' | 'missing-user';
};
