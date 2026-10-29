import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { getTranslations } from 'next-intl/server';
import { randomBytes } from 'node:crypto';

import { sessionTransferResponseHeaders } from '@/supacharger/auth/session-transfer';
import { SC_CONFIG } from '@/supacharger/supacharger-config';

import 'server-only';

function escapeHtml(value: string) {
  return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
}

export async function GET(_request: NextRequest) {
  if (!SC_CONFIG.SUPABASE_AUTH.METHODS.CROSS_DEVICE_SESSION_TRANSFER.ENABLED) {
    return new NextResponse(null, { status: 404, headers: sessionTransferResponseHeaders() });
  }

  const t = await getTranslations('SessionTransfer');
  const nonce = randomBytes(18).toString('base64url');
  const messages = JSON.stringify({
    invalid: t('invalid'),
    conflict: t('conflict'),
    retry: t('retry'),
  }).replaceAll('<', '\\u003c');
  const title = escapeHtml(t('title'));
  const working = escapeHtml(t('working'));
  const csp = [
    "default-src 'none'",
    `script-src 'nonce-${nonce}'`,
    `style-src 'nonce-${nonce}'`,
    "connect-src 'self'",
    "base-uri 'none'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ].join('; ');

  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title}</title><style nonce="${nonce}">:root{color-scheme:dark}body{margin:0;min-height:100vh;display:grid;place-items:center;background:#111;color:#f5f5f5;font:16px system-ui,sans-serif}main{width:min(34rem,calc(100% - 3rem));text-align:center}h1{font-size:2rem}p{line-height:1.6;color:#c8c8c8}</style></head>
<body><main><h1>${title}</h1><p id="status" role="status">${working}</p></main>
<script nonce="${nonce}">(()=>{'use strict';const m=${messages};const s=document.getElementById('status');const p=new URLSearchParams(location.hash.slice(1));const token=p.get('token');history.replaceState(null,'',location.pathname+location.search);const fail=k=>{s.textContent=m[k]};if(!token||!/^[A-Za-z0-9_-]{43}$/.test(token)){fail('invalid');return}fetch('/api/auth/session-transfers/redeem',{method:'POST',credentials:'same-origin',cache:'no-store',headers:{'content-type':'application/json'},body:JSON.stringify({token})}).then(async r=>({r,b:await r.json().catch(()=>({}))})).then(({r,b})=>{if(r.ok&&typeof b.redirectTo==='string'&&b.redirectTo.startsWith('/')&&!b.redirectTo.startsWith('//')){location.replace(b.redirectTo);return}fail(r.status===409?'conflict':r.status===400?'invalid':'retry')}).catch(()=>fail('retry'))})();</script></body></html>`;

  return new NextResponse(html, {
    headers: {
      ...sessionTransferResponseHeaders(),
      'Content-Security-Policy': csp,
      'Content-Type': 'text/html; charset=utf-8',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
