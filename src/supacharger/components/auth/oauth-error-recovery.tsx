'use client';

import { type ReactNode, useEffect, useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';

import { isOAuthCancellation, OAUTH_CANCELLED_PATH } from '@/supacharger/auth/oauth-cancellation';

function subscribe(onChange: () => void) {
  window.addEventListener('hashchange', onChange);
  return () => window.removeEventListener('hashchange', onChange);
}

function getSnapshot() {
  return window.location.search + window.location.hash;
}

function getServerSnapshot(): null {
  return null;
}

export function OAuthErrorRecovery({ children }: { children: ReactNode }) {
  const router = useRouter();
  const location = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [query, hash = ''] = location?.split('#') ?? [];
  const cancelled = location !== null && (
    isOAuthCancellation(new URLSearchParams(query)) ||
    isOAuthCancellation(new URLSearchParams(hash))
  );

  useEffect(() => {
    if (cancelled) router.replace(OAUTH_CANCELLED_PATH, { scroll: false });
  }, [cancelled, router]);

  // Fragments never reach the server. Wait for the browser before showing an error.
  if (location === null || cancelled) return null;
  return children;
}
