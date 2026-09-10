import { z } from 'zod';

import { combineChunks, stringFromBase64URL } from '@supabase/ssr';

const tokenState = z.object({ access_token: z.string().min(1).max(16384) });

/** Extract only; callers MUST verify this untrusted JWT with getClaims(token). */
export async function readAccessToken(supabaseUrl: string, cookies: { name: string; value: string }[]) {
  const key = `sb-${new URL(supabaseUrl).hostname.split('.')[0]}-auth-token`;
  const value = await combineChunks(key, (name) => cookies.find((cookie) => cookie.name === name)?.value);
  if (!value || value.length > 32768) return null;
  try {
    const parsed = tokenState.safeParse(JSON.parse(value.startsWith('base64-') ? stringFromBase64URL(value.slice(7)) : value));
    return parsed.success ? parsed.data.access_token : null;
  } catch {
    return null;
  }
}
