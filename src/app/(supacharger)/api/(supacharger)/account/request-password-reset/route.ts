'use server';

import { NextRequest, NextResponse } from 'next/server';

import { sendPasswordReset } from '@/lib/supabase/supacharger/supabase-auth';
import { isValidEmail } from '@/supacharger/utils/helpers';

export async function POST(req: NextRequest) {
  const { email } = await req.json();

  if (!isValidEmail(email)) {
    return NextResponse.json({ error: 'invalid_email' }, { status: 500 });
  }

  try {
    const result = await sendPasswordReset(email);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}