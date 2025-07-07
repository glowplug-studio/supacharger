import { NextRequest, NextResponse } from 'next/server';

import { createUserByEmailPassword } from '@/lib/supabase/supacharger/supabase-auth';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Missing email or password' }, { status: 400 });
    }

    // Create FormData and append fields
    const formData = new FormData();
    formData.append('email', email);
    formData.append('password', password);

    const result = await createUserByEmailPassword(formData);

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || err || 'Unknown error' }, { status: 500 });
  }
}
