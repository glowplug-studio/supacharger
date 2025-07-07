'use server';

import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

import { getUser, getUserSession } from '@/lib/supabase/supacharger/supabase-auth';
import { evaluatePasswordStrength } from '@/supacharger/utils/helpers';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function POST(request: NextRequest) {
  // Parse the request body
  const { password, newPassword, newPasswordRetype } = await request.json();

  // Evaluate passwords
  if (!password) {
    return NextResponse.json({ error: 'oldPasswordRequired' }, { status: 400 });
  }
  if (newPassword !== newPasswordRetype) {
    return NextResponse.json({ error: 'provided_password_mismatch' }, { status: 400 });
  }
  const passStrengthValidity = evaluatePasswordStrength(newPassword);
  if (!passStrengthValidity.valid) {
    return NextResponse.json({ error: passStrengthValidity.message }, { status: 400 });
  }

  // Get the userSession and accessToken
  const supaSession = await getUserSession();

  // Check that supaSession has a session property and it's not null
  if (!('session' in supaSession) || !supaSession.session) {
    return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
  }

  const { access_token: accessToken, user: sessionUser } = supaSession.session;

  // Get the user by JWT
  //This method is useful for checking if the user is authorized because it validates the user's access token JWT on the server.

  const supaUser = await getUser(accessToken, true);

  // Type guard for supaUser: must have .data and .supabase
  if (
    !supaUser ||
    !('data' in supaUser) ||
    !supaUser.data ||
    !('user' in supaUser.data) ||
    !supaUser.data.user ||
    !('supabase' in supaUser) ||
    !supaUser.supabase
  ) {
    return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
  }

  const { id: supaUserId } = supaUser.data.user;
  const { id: supaSessionId } = sessionUser;

  // Server side verification that supplied token data is valid for the current user session.
  // @todo It's probaly uncessary to check the User as well as only the JWT is passed to the rpc call. Anyway be extra safe when it comes to password update.

  if (
    !supaUserId ||
    !supaSessionId ||
    supaUserId !== supaSessionId
  ) {
    return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
  }

  // Use the access token to make the client
  const supabase = createClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      global: {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    }
  );

  // RPC call to function
  const { data, error } = await supabase.rpc('verify_user_password', {
    password,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data?.matched) {
    return NextResponse.json({ error: 'oldPasswordIncorrect' }, { status: 400 });
  }

  // data.matched == true
  const { data: updateData, error: updateError } = await supaUser.supabase.auth.updateUser({
    password: newPassword,
  });

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  } else {
    return NextResponse.json({ data: { updated: true } });
  }
}
