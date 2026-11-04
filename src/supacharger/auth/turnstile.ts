import { z } from 'zod';

import { SC_CONFIG } from '@/supacharger/supacharger-config';

import 'server-only';

const tokenSchema = z.string().min(1).max(2048);
const resultSchema = z.object({ success: z.boolean(), hostname: z.string().optional() });

/** Fail closed before dispatching to the selected authentication service. */
export async function verifyTurnstileToken(value: unknown): Promise<boolean> {
  const { ENABLED, HOSTNAMES, SITE_KEY } = SC_CONFIG.AUTHENTICATION.TURNSTILE;
  if (!ENABLED) return true;

  const token = tokenSchema.safeParse(value);
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!token.success || !secret || !SITE_KEY || HOSTNAMES.length === 0) return false;

  try {
    const body = new FormData();
    body.set('secret', secret);
    body.set('response', token.data);
    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body,
      cache: 'no-store',
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) return false;
    const result = resultSchema.safeParse(await response.json());
    return result.success && result.data.success && HOSTNAMES.includes(result.data.hostname ?? '');
  } catch {
    return false;
  }
}
