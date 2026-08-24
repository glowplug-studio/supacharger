'use client';

import { useCallback, useEffect, useSyncExternalStore } from 'react';

import {
  ACCOUNT_SUMMARY_CHANGED_EVENT,
  type AccountSummary,
  type AccountSummaryChangedDetail,
} from './account-summary-contract';

type AccountSummaryResponse = { summary: AccountSummary | null };
type SummarySnapshot = AccountSummary | null | undefined;

let cachedSummary: SummarySnapshot;
let inFlightRequest: Promise<SummarySnapshot> | null = null;
const subscribers = new Set<() => void>();

function emitChange() {
  for (const subscriber of subscribers) subscriber();
}

function setCachedSummary(summary: SummarySnapshot) {
  cachedSummary = summary;
  emitChange();
}

async function requestAccountSummary(): Promise<SummarySnapshot> {
  if (inFlightRequest) return inFlightRequest;

  inFlightRequest = fetch('/api/account/summary', {
    cache: 'no-store',
    credentials: 'same-origin',
    headers: { Accept: 'application/json' },
  })
    .then(async (response) => {
      if (response.status === 401) return null;
      if (!response.ok) return undefined;

      const payload = (await response.json()) as AccountSummaryResponse;
      return payload.summary;
    })
    .finally(() => {
      inFlightRequest = null;
    });

  return inFlightRequest;
}

async function refreshAccountSummary() {
  const summary = await requestAccountSummary();
  if (summary !== undefined) setCachedSummary(summary);
}

function subscribe(subscriber: () => void) {
  subscribers.add(subscriber);
  return () => subscribers.delete(subscriber);
}

function getSnapshot() {
  return cachedSummary;
}

export function useAccountSummary(initialSummary: AccountSummary | null = null) {
  const summary = useSyncExternalStore(subscribe, getSnapshot, () => initialSummary);
  const reload = useCallback(async () => {
    cachedSummary = undefined;
    await refreshAccountSummary();
  }, []);

  useEffect(() => {
    if (cachedSummary === undefined && initialSummary !== null) setCachedSummary(initialSummary);
    void refreshAccountSummary();

    const handleChange = (event: Event) => {
      const detail = (event as CustomEvent<AccountSummaryChangedDetail>).detail;
      if (detail && Object.hasOwn(detail, 'summary')) {
        setCachedSummary(detail.summary ?? null);
        return;
      }
      void reload();
    };

    window.addEventListener(ACCOUNT_SUMMARY_CHANGED_EVENT, handleChange);
    return () => window.removeEventListener(ACCOUNT_SUMMARY_CHANGED_EVENT, handleChange);
  }, [initialSummary, reload]);

  return { summary: summary ?? null, reload };
}
