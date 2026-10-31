import { type NextRequest, NextResponse } from 'next/server.js';
import { createHash } from 'node:crypto';

import { copySupabaseResponseState } from './proxy-response';
import { getSafeNextPath } from './safe-next-path';

export const unavailableEnglishCopy = {
  statusLabel: 'Service status',
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
:root{color-scheme:light;font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;background:#fbfcf8;color:#121512}
*{box-sizing:border-box}body{margin:0;background:radial-gradient(circle at 50% 15%,#effaf1 0,transparent 35rem),#fbfcf8}
main{min-height:100vh;min-height:100svh;display:grid;grid-template-rows:auto 1fr;padding:24px clamp(24px,5vw,72px) 48px}
.brand-lockup{display:flex;align-items:center;gap:9px;width:max-content;color:#121512;font-size:21px;font-weight:700;letter-spacing:-.04em}
.logo{display:block;width:26px;height:26px;object-fit:contain}
.panel{align-self:center;width:100%;max-width:760px;margin:0 auto;padding:72px 0 112px;text-align:center}
.eyebrow{margin:0 0 20px;color:#00a74e;font-size:13px;font-weight:700;letter-spacing:.16em;text-transform:uppercase}
h1{margin:0;font-size:clamp(42px,8vw,76px);line-height:1.02;font-weight:600;letter-spacing:-.055em;text-wrap:balance}
.description{max-width:580px;margin:24px auto 32px;color:#626862;font-size:17px;line-height:1.7;text-wrap:balance}
.retry{display:inline-flex;align-items:center;justify-content:center;min-height:48px;padding:12px 24px;border:1px solid #00a74e;border-radius:8px;background:#00a74e;color:#fff;font-size:14px;font-weight:650;text-decoration:none;transition:background-color 160ms ease,transform 120ms ease}
.retry:hover{background:#008f43}.retry:active{transform:translateY(1px)}.retry:focus-visible{outline:3px solid #86d6a8;outline-offset:4px}
@media(max-width:500px){main{padding:20px 24px 32px}.panel{padding:52px 0 80px}.description{font-size:16px}}
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
    const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${copy.title} · ${title}</title><style>${styles}</style></head><body><main><div class="brand-lockup"><svg class="logo" aria-hidden="true" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M39.1229 14.3065C35.3783 2.01835 24.031 0 20.5134 0C14.8965 0 11.6625 1.48408 9.61998 2.84943C4.40024 6.23314 0.428695 12.1101 0.0315411 19.3524C-0.535822 30.2159 6.61296 39.061 16.4851 39.9514C22.3289 40.4857 32.6549 36.6865 32.7684 24.8138C32.9386 17.4528 29.5344 15.197 27.8891 14.0097C26.187 12.7631 23.8608 11.9914 21.024 12.1695C18.1872 12.3475 14.4993 14.544 14.2724 18.0464C13.9887 22.8548 17.3929 23.9234 18.2439 24.0421C19.0382 24.1015 18.7545 24.0421 18.7545 24.0421C18.7545 24.0421 17.6198 22.6767 17.9602 20.7771C18.3006 18.5807 19.7191 17.9277 21.5914 18.0464C23.5204 18.2245 24.8253 20.2429 24.7686 22.9142C24.7119 25.5262 23.18 28.6724 18.1872 28.4943C13.1944 28.3163 10.5845 24.1015 10.5845 20.0648C10.5845 16.0281 14.1589 8.66703 22.2155 8.66703C30.272 8.66703 34.5272 15.85 35.6052 19.7086C37.2506 25.4668 34.9244 33.4215 34.9244 33.4215C34.9244 33.4215 42.5271 25.2294 39.1229 14.3065Z" fill="#00A74E"/></svg><span>${title}</span></div><div class="panel"><p class="eyebrow">${copy.statusLabel}</p><h1 aria-live="polite">${options.demo ? copy.issues : copy.title}</h1><p class="description">${options.demo ? copy.issuesDescription : copy.description}</p>${options.demo ? `<p class="description">${copy.demoReload}</p>` : `<a class="retry" href="${retryHref}">${copy.retry}</a>`}</div></main><script>${script}</script></body></html>`;
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
