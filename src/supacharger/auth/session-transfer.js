import { createHash, randomBytes } from 'node:crypto';
import { z } from 'zod';

import { getSafeNextPath } from './safe-next-path.js';

export const SESSION_TRANSFER_TOKEN_BYTES = 32;
export const SESSION_TRANSFER_TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;
export const SESSION_TRANSFER_MIN_TTL_SECONDS = 60;
export const SESSION_TRANSFER_MAX_TTL_SECONDS = 300;
export const SESSION_TRANSFER_ISSUE_BODY_MAX_BYTES = 4096;
export const SESSION_TRANSFER_REDEEM_BODY_MAX_BYTES = 256;

export const sessionTransferIssueSchema = z
  .object({ next: z.string().max(2048).optional() })
  .strict();

export const sessionTransferRedeemSchema = z
  .object({ token: z.string().length(43).regex(SESSION_TRANSFER_TOKEN_PATTERN) })
  .strict();

export function createSessionTransferGrant() {
  return randomBytes(SESSION_TRANSFER_TOKEN_BYTES).toString('base64url');
}

export function hashSessionTransferGrant(grant) {
  return createHash('sha256').update(grant, 'utf8').digest('hex');
}

export function resolveSessionTransferNextPath(value, fallback) {
  if (value !== undefined) return getSafeNextPath(value);
  return getSafeNextPath(fallback);
}

export function isSameOriginSessionTransferRequest(request, siteUrl) {
  const expected = new URL(siteUrl);
  const origin = request.headers.get('origin');
  const host = request.headers.get('host');
  return origin === expected.origin && host === expected.host;
}

export function sessionTransferResponseHeaders() {
  return {
    'Cache-Control': 'private, no-store, max-age=0',
    Pragma: 'no-cache',
    'Referrer-Policy': 'no-referrer',
  };
}

export async function readSessionTransferJson(request, maximumBytes) {
  const declaredLength = Number(request.headers.get('content-length'));
  if (Number.isFinite(declaredLength) && declaredLength > maximumBytes) throw new Error('invalid_body');
  const body = await request.text();
  if (Buffer.byteLength(body, 'utf8') > maximumBytes) throw new Error('invalid_body');
  return JSON.parse(body);
}
