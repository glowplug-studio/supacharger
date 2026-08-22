'use server';

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { resendAccountConfirmEmail } from '@/lib/supabase/supacharger/supabase-auth';
import { getSafeNextPath } from '@/supacharger/auth/safe-next-path';

const requestSchema = z.object({
  email: z.email(),
  next: z.string().nullable().optional(),
});

export async function POST(req: NextRequest) {
  let body: unknown;

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid_request' }, { status: 400 });
  }

  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'invalid_request' }, { status: 400 });

  try {
    const result = await resendAccountConfirmEmail(parsed.data.email, getSafeNextPath(parsed.data.next));
    return NextResponse.json(result, {
      status: result.error?.status ?? (result.error ? 400 : 200),
    });
  } catch (err) {
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}
