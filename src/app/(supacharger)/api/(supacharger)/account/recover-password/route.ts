import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import { createClient } from '@/lib/supabase/server';
import { hasRecoveryAuthenticationMethod } from '@/supacharger/auth/recovery-session';
import { evaluatePasswordStrength } from '@/supacharger/utils/helpers';

const recoveryPasswordSchema = z
  .object({
    newPassword: z.string().min(1).max(256),
    newPasswordRetype: z.string().min(1).max(256),
  })
  .strict();

export async function POST(request: NextRequest) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'provided_password_mismatch' }, { status: 400 });
  }

  const parsed = recoveryPasswordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'provided_password_mismatch' }, { status: 400 });
  }

  const { newPassword, newPasswordRetype } = parsed.data;
  if (newPassword !== newPasswordRetype) {
    return NextResponse.json({ error: 'provided_password_mismatch' }, { status: 400 });
  }

  const passwordStrength = evaluatePasswordStrength(newPassword);
  if (!passwordStrength.valid) {
    return NextResponse.json({ error: passwordStrength.message }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  if (claimsError || !hasRecoveryAuthenticationMethod(claimsData?.claims)) {
    return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
  }

  const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
  if (updateError) {
    return NextResponse.json({ error: 'passwordUpdateFailed' }, { status: 500 });
  }

  return NextResponse.json({ data: { updated: true } });
}
