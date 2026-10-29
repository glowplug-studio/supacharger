import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';
import { getSupabaseAdminClient } from '@/lib/supabase/supacharger/supabase-admin';
import { resolveAuthCallbackSuccess } from '@/supacharger.adapters/auth-callback';
import {
  hashSessionTransferGrant,
  isSameOriginSessionTransferRequest,
  readSessionTransferJson,
  SESSION_TRANSFER_REDEEM_BODY_MAX_BYTES,
  sessionTransferRedeemSchema,
  sessionTransferResponseHeaders,
} from '@/supacharger/auth/session-transfer';
import { SC_CONFIG } from '@/supacharger/supacharger-config';
import { getAppRequestOrigin } from '@/supacharger/utils/request-url';

import 'server-only';

function json(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: sessionTransferResponseHeaders() });
}

function relativeDestination(value: string | URL, origin: string) {
  const url = typeof value === 'string' ? new URL(value, origin) : value;
  if (url.origin !== origin) throw new Error('Unsafe transfer destination');
  return `${url.pathname}${url.search}${url.hash}`;
}

export async function POST(request: NextRequest) {
  if (!SC_CONFIG.SUPABASE_AUTH.METHODS.CROSS_DEVICE_SESSION_TRANSFER.ENABLED) {
    return json({ error: 'not_found' }, 404);
  }
  let origin: string;
  try {
    origin = getAppRequestOrigin(request);
  } catch {
    return json({ error: 'invalid_request' }, 403);
  }
  if (!isSameOriginSessionTransferRequest(request, origin)) {
    return json({ error: 'invalid_request' }, 403);
  }

  let body: unknown;
  try {
    body = await readSessionTransferJson(request, SESSION_TRANSFER_REDEEM_BODY_MAX_BYTES);
  } catch {
    return json({ error: 'invalid_transfer' }, 400);
  }
  const parsed = sessionTransferRedeemSchema.safeParse(body);
  if (!parsed.success) return json({ error: 'invalid_transfer' }, 400);

  const admin = getSupabaseAdminClient();
  const { data: claim, error: claimError } = await admin
    .schema('api_edge')
    .rpc('claim_auth_session_transfer', {
      token_hash: hashSessionTransferGrant(parsed.data.token),
    })
    .maybeSingle();
  if (claimError || !claim) return json({ error: 'invalid_transfer' }, 400);

  const supabase = await createClient();
  const {
    data: { user: receivingUser },
  } = await supabase.auth.getUser();

  const context = {
    code: null,
    nextPath: claim.next_path,
    requestUrl: new URL(request.url),
    supabase,
  };

  if (receivingUser?.id) {
    if (receivingUser.id !== claim.user_id) {
      return json({ error: 'receiving_session_conflict' }, 409);
    }
    try {
      return json({ redirectTo: relativeDestination(await resolveAuthCallbackSuccess(context), origin) });
    } catch {
      return json({ error: 'server_error' }, 500);
    }
  }

  const { data: userData, error: lookupError } = await admin.auth.admin.getUserById(claim.user_id);
  const claimedUser = userData?.user;
  if (lookupError || !claimedUser?.email || !claimedUser.email_confirmed_at) {
    return json({ error: 'server_error' }, 500);
  }

  const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
    type: 'magiclink',
    email: claimedUser.email,
  });
  const tokenHash = linkData?.properties?.hashed_token;
  if (linkError || !tokenHash) return json({ error: 'server_error' }, 500);

  const { data: verification, error: verificationError } = await supabase.auth.verifyOtp({
    token_hash: tokenHash,
    type: 'email',
  });
  if (verificationError || verification.user?.id !== claim.user_id) {
    await supabase.auth.signOut({ scope: 'local' });
    return json({ error: 'server_error' }, 500);
  }

  const {
    data: { user: verifiedUser },
  } = await supabase.auth.getUser();
  if (verifiedUser?.id !== claim.user_id) {
    await supabase.auth.signOut({ scope: 'local' });
    return json({ error: 'server_error' }, 500);
  }

  try {
    return json({ redirectTo: relativeDestination(await resolveAuthCallbackSuccess(context), origin) });
  } catch {
    await supabase.auth.signOut({ scope: 'local' });
    return json({ error: 'server_error' }, 500);
  }
}
