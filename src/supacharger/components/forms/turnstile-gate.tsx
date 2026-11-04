'use client';

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import Script from 'next/script';

import { SC_CONFIG } from '@/supacharger/supacharger-config';

type TurnstileApi = {
  render: (element: HTMLElement, options: Record<string, unknown>) => string;
  reset: (widgetId: string) => void;
  remove: (widgetId: string) => void;
};

declare global {
  interface Window { turnstile?: TurnstileApi }
}

type Gate = { enabled: boolean; takeToken: () => string | null };
const Context = createContext<Gate>({ enabled: false, takeToken: () => '' });

export function useTurnstileGate() {
  return useContext(Context);
}

export function TurnstileGate({ children }: { children: React.ReactNode }) {
  const { ENABLED, SITE_KEY } = SC_CONFIG.AUTHENTICATION.TURNSTILE;
  const element = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);
  const token = useRef<string | null>(null);
  const [scriptReady, setScriptReady] = useState(false);

  useEffect(() => {
    if (!ENABLED || !SITE_KEY || !scriptReady || !element.current || !window.turnstile || widgetId.current) return;
    widgetId.current = window.turnstile.render(element.current, {
      sitekey: SITE_KEY,
      callback: (value: string) => { token.current = value; },
      'expired-callback': () => { token.current = null; },
      'error-callback': () => { token.current = null; },
    });
    return () => {
      if (widgetId.current) window.turnstile?.remove(widgetId.current);
      widgetId.current = null;
      token.current = null;
    };
  }, [ENABLED, SITE_KEY, scriptReady]);

  const takeToken = useCallback(() => {
    if (!ENABLED) return '';
    const value = token.current;
    token.current = null;
    if (widgetId.current) window.turnstile?.reset(widgetId.current);
    return value;
  }, [ENABLED]);

  return (
    <Context.Provider value={{ enabled: ENABLED, takeToken }}>
      {children}
      {ENABLED ? (
        <>
          <Script src='https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit' onReady={() => setScriptReady(true)} />
          <div ref={element} className='sc-auth-turnstile mt-4 flex justify-center' />
        </>
      ) : null}
    </Context.Provider>
  );
}
