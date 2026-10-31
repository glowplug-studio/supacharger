import { type NextRequest, NextResponse } from 'next/server.js';
import { createHash } from 'node:crypto';

import { copySupabaseResponseState } from './proxy-response';
import { getSafeNextPath } from './safe-next-path';

export const unavailableEnglishCopy = {
  title: 'We’ll be back shortly',
  description: 'We’re having trouble connecting. Please try again in a moment.',
  retry: 'Try again',
  checking: 'Reconnecting…',
  checkingDescription: 'We’re checking the connection. Your session is preserved.',
  issues: 'We’re having issues',
  issuesDescription: 'The service is temporarily unavailable. We’ll keep checking in the background.',
  retrying: 'Checking the connection…',
  demoExit: 'Return to demo',
  demoReload: 'Reload the page to close this preview.',
};

// This document deliberately has no React, application layout, remote font or Auth dependency.
const styles = `
:root{color-scheme:dark;font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;background:#0b0b0c;color:#fff}
*{box-sizing:border-box}body{margin:0}main{min-height:100vh;min-height:100svh;display:grid;place-items:center;padding:24px}
.panel{width:100%;max-width:480px;padding:48px 32px;text-align:center;background:#0f0f11;border-radius:16px}
.logo{display:block;width:64px;height:64px;object-fit:contain;margin:0 auto 16px;border-radius:14px}
.brand{margin:0 0 36px;color:#b7b7b7;font-size:14px;font-weight:600;overflow-wrap:anywhere}
h1{margin:0;font-size:clamp(26px,6vw,34px);line-height:1.18;letter-spacing:-.035em;text-wrap:balance}
.description{margin:18px 0 28px;color:#b7b7b7;font-size:16px;line-height:1.65;text-wrap:balance}
.retry{display:inline-flex;align-items:center;justify-content:center;min-height:48px;padding:12px 26px;border-radius:999px;background:#fff;color:#0b0b0c;font-size:14px;font-weight:650;text-decoration:none}
.retry:hover{background:#e4e4e7}.retry:focus-visible{outline:3px solid #fff;outline-offset:5px}
@media(max-width:380px){.panel{padding:36px 20px}}
`;
const styleHash = createHash('sha256').update(styles).digest('base64');

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]!);
}

export function createAuthUnavailableResponse(
  request: NextRequest,
  sessionResponse: NextResponse,
  siteTitle: string,
  messages: unknown,
  options: { next?: string; demo?: boolean; forcePage?: boolean } = {},
) {
  const catalogue = messages && typeof messages === 'object' ? messages as Record<string, unknown> : {};
  const copy = Object.fromEntries(Object.entries(unavailableEnglishCopy).map(([key, fallback]) => {
    const value = catalogue[key];
    return [key, escapeHtml(typeof value === 'string' && value.trim() ? value : fallback)];
  }));
  const isApi = request.nextUrl.pathname === '/api' || request.nextUrl.pathname.startsWith('/api/');
  const isPage = !isApi && (request.method === 'GET' || request.method === 'HEAD') && (
    request.headers.get('accept')?.includes('text/html') || request.headers.get('rsc') === '1'
  );
  let result: NextResponse;
  if (isPage || options.forcePage) {
    const retryUrl = request.nextUrl.clone();
    retryUrl.searchParams.delete('_rsc');
    // Prefix with this origin so even a //pathname cannot become an external link.
    const next = getSafeNextPath(options.next) ?? `${retryUrl.pathname}${retryUrl.search}`;
    const retryHref = escapeHtml(new URL(next, retryUrl.origin).href);
    const scriptCopy = JSON.stringify(Object.fromEntries(Object.entries(unavailableEnglishCopy).map(([key, fallback]) => [key, typeof catalogue[key] === 'string' && (catalogue[key] as string).trim() ? catalogue[key] : fallback]))).replace(/</g, '\u003c');
    const script = `(()=>{const demo=${Boolean(options.demo)};const next=${JSON.stringify(next).replace(/</g, '\u003c')};const copy=${scriptCopy};const title=document.querySelector('h1');const description=document.querySelector('.description');const retry=document.querySelector('.retry');let timer;let pending=false;const started=Date.now();const warning=()=>{title.textContent=copy.issues;description.textContent=copy.issuesDescription};if(demo){warning();return}title.textContent=copy.checking;description.textContent=copy.checkingDescription;setTimeout(warning,10000);async function check(){if(pending)return;clearTimeout(timer);pending=true;retry.setAttribute('aria-busy','true');const controller=new AbortController();const deadline=setTimeout(()=>controller.abort(),10000);try{const response=await fetch('/auth/availability',{cache:'no-store',credentials:'same-origin',signal:controller.signal});if(response.ok||response.status===401){location.replace(next);return}}catch{}finally{clearTimeout(deadline);pending=false;retry.removeAttribute('aria-busy')}timer=setTimeout(check,Date.now()-started<10000?2000:30000)}retry.addEventListener('click',event=>{event.preventDefault();void check()});timer=setTimeout(check,0)})();`;
    const scriptHash = createHash('sha256').update(script).digest('base64');
    const title = escapeHtml(siteTitle);
    const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${copy.title} · ${title}</title><style>${styles}</style></head><body><main><div class="panel"><img class="logo" src="/favicons/apple-touch-icon.png" alt="" width="64" height="64"><p class="brand">${title}</p><h1 aria-live="polite">${options.demo ? copy.issues : copy.title}</h1><p class="description">${options.demo ? copy.issuesDescription : copy.description}</p>${options.demo ? `<p class="description">${copy.demoReload}</p>` : `<a class="retry" href="${retryHref}">${copy.retry}</a>`}</div></main><script>${script}</script></body></html>`;
    // Next's router treats a non-Flight 503 as a full document navigation.
    result = new NextResponse(request.method === 'HEAD' ? null : html, {
      status: 503,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Security-Policy': `default-src 'none'; img-src 'self'; style-src 'sha256-${styleHash}'; script-src 'sha256-${scriptHash}'; connect-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors ${options.demo ? "'self'" : "'none'"}`,
        'Referrer-Policy': 'no-referrer',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } else {
    result = NextResponse.json({ error: 'auth_temporarily_unavailable' }, { status: 503 });
  }
  copySupabaseResponseState(sessionResponse, result);
  result.headers.set('Retry-After', '30');
  result.headers.set('Cache-Control', 'private, no-store');
  result.headers.set('Pragma', 'no-cache');
  result.headers.set('Expires', '0');
  result.headers.set('Vary', 'Accept, RSC');
  return result;
}
