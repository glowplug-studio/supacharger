import { connection, type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { createClient } from '@/lib/supabase/server';
import { appURL } from '@/supacharger/utils/app-origin';
import { getAppRequestOrigin } from '@/supacharger/utils/request-url';

const emailUpdateSchema = z.object({
  currentPassword: z.string().min(1).max(256),
  email: z.string().trim().pipe(z.email()).transform((value) => value.toLowerCase()),
}).strict();

export async function POST(request: NextRequest) {
  await connection();
  const origin = getAppRequestOrigin(request);
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'invalidRequest' }, { status: 400 });
  }
  const parsed = emailUpdateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ ok: false, error: 'invalidRequest' }, { status: 422 });

  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user?.email || user.is_anonymous) {
    return NextResponse.json({ ok: false, error: 'unauthenticated' }, { status: 401 });
  }
  const hasPasswordIdentity = (user.identities ?? []).some((identity) => identity.provider === 'email');
  if (!hasPasswordIdentity) return NextResponse.json({ ok: false, error: 'passwordIdentityRequired' }, { status: 403 });
  if (user.email.toLowerCase() === parsed.data.email) return NextResponse.json({ ok: false, error: 'emailUnchanged' }, { status: 409 });

  const reauthentication = await supabase.auth.signInWithPassword({ email: user.email, password: parsed.data.currentPassword });
  if (reauthentication.error) return NextResponse.json({ ok: false, error: 'oldPasswordIncorrect' }, { status: 400 });

  const update = await supabase.auth.updateUser(
    { email: parsed.data.email },
    { emailRedirectTo: appURL('/auth/confirm?next=/account/security', origin) },
  );
  if (update.error) return NextResponse.json({ ok: false, error: 'emailUpdateFailed' }, { status: 400 });
  return NextResponse.json({ ok: true });
}
