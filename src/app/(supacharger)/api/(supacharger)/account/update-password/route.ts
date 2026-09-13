import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import { createClient } from '@/lib/supabase/server';
import { evaluatePasswordStrength } from '@/supacharger/utils/helpers';

const passwordUpdateSchema = z
  .object({
    password: z.string().min(1).max(256),
    newPassword: z.string().min(1).max(256),
    newPasswordRetype: z.string().min(1).max(256),
  })
  .strict();

export async function POST(request: NextRequest) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'oldPasswordRequired' }, { status: 400 });
  }

  const parsed = passwordUpdateSchema.safeParse(body);
  if (!parsed.success) {
    const passwordMissing = parsed.error.issues.some((issue) => issue.path[0] === 'password');
    return NextResponse.json(
      { error: passwordMissing ? 'oldPasswordRequired' : 'provided_password_mismatch' },
      { status: 400 },
    );
  }

  const { password, newPassword, newPasswordRetype } = parsed.data;
  if (newPassword !== newPasswordRetype) {
    return NextResponse.json({ error: 'provided_password_mismatch' }, { status: 400 });
  }

  const passwordStrength = evaluatePasswordStrength(newPassword);
  if (!passwordStrength.valid) {
    return NextResponse.json({ error: passwordStrength.message }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user?.email) {
    return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
  }

  const { error: reauthenticationError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password,
  });

  if (reauthenticationError) {
    return NextResponse.json({ error: 'oldPasswordIncorrect' }, { status: 400 });
  }

  const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
  if (updateError) {
    if (updateError.code === 'same_password') {
      return NextResponse.json({ error: 'samePassword' }, { status: 400 });
    }
    return NextResponse.json({ error: 'passwordUpdateFailed' }, { status: 500 });
  }

  return NextResponse.json({ data: { updated: true } });
}
