import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';
import { getSupabaseAdminClient } from '@/lib/supabase/supacharger/supabase-admin';
import {
  createSessionTransferGrant,
  hashSessionTransferGrant,
  isSameOriginSessionTransferRequest,
  readSessionTransferJson,
  resolveSessionTransferNextPath,
  SESSION_TRANSFER_ISSUE_BODY_MAX_BYTES,
  SESSION_TRANSFER_MAX_TTL_SECONDS,
  SESSION_TRANSFER_MIN_TTL_SECONDS,
  sessionTransferIssueSchema,
  sessionTransferResponseHeaders,
} from '@/supacharger/auth/session-transfer';
import { SC_CONFIG } from '@/supacharger/supacharger-config';
import { appURL } from '@/supacharger/utils/app-origin';
import { getAppRequestOrigin } from '@/supacharger/utils/request-url';

import 'server-only';

function json(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: sessionTransferResponseHeaders() });
}

export async function POST(request: NextRequest) {
  const policy = SC_CONFIG.SUPABASE_AUTH.METHODS.CROSS_DEVICE_SESSION_TRANSFER;
  if (!policy.ENABLED) return json({ error: 'not_found' }, 404);
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
    body = await readSessionTransferJson(request, SESSION_TRANSFER_ISSUE_BODY_MAX_BYTES);
  } catch {
    return json({ error: 'invalid_request' }, 400);
  }

  const parsed = sessionTransferIssueSchema.safeParse(body);
  if (!parsed.success) return json({ error: 'invalid_request' }, 400);

  const nextPath = resolveSessionTransferNextPath(
    parsed.data.next,
    SC_CONFIG.USER_REDIRECTS.AUTHED_USER.LOGIN_REDIRECT_DESTINATION,
  );
  if (!nextPath) return json({ error: 'invalid_request' }, 400);

  if (
    !Number.isInteger(policy.TOKEN_TTL_SECONDS) ||
    policy.TOKEN_TTL_SECONDS < SESSION_TRANSFER_MIN_TTL_SECONDS ||
    policy.TOKEN_TTL_SECONDS > SESSION_TRANSFER_MAX_TTL_SECONDS
  ) {
    return json({ error: 'server_error' }, 500);
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user?.id || user.is_anonymous || !user.email || !user.email_confirmed_at) {
    return json({ error: 'unauthenticated' }, 401);
  }

  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  const sourceSessionId = claimsData?.claims?.session_id;
  if (claimsError || typeof sourceSessionId !== 'string') {
    return json({ error: 'unauthenticated' }, 401);
  }

  if (SC_CONFIG.SUPABASE_AUTH.METHODS.MFA_TOTP.REQUIRED_FOR_SIGN_IN) {
    const { data: assurance, error: assuranceError } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (assuranceError) return json({ error: 'server_error' }, 500);
    if (assurance?.nextLevel === 'aal2' && assurance.currentLevel !== 'aal2') {
      return json({ error: 'mfa_required' }, 403);
    }
  }

  const grant = createSessionTransferGrant();
  const tokenHash = hashSessionTransferGrant(grant);
  const requestedExpiry = new Date(Date.now() + policy.TOKEN_TTL_SECONDS * 1000).toISOString();
  const admin = getSupabaseAdminClient();
  const { data, error } = await admin
    .schema('api_edge')
    .rpc('create_auth_session_transfer', {
      user_id: user.id,
      source_session_id: sourceSessionId,
      token_hash: tokenHash,
      next_path: nextPath,
      requested_expires_at: requestedExpiry,
    })
    .single();

  if (error) {
    if (error.message === 'auth_session_transfer_rate_limited') {
      return json({ error: 'rate_limited' }, 429);
    }
    return json({ error: 'server_error' }, 500);
  }

  return json({
    transferUrl: `${appURL('/auth/session-transfer', origin)}#token=${grant}`,
    expiresAt: data.expires_at,
  });
}
