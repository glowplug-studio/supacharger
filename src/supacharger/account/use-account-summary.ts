'use client';

import { useCallback, useEffect, useState } from 'react';

import {
  ACCOUNT_SUMMARY_CHANGED_EVENT,
  type AccountSummary,
  type AccountSummaryChangedDetail,
} from './account-summary-contract';

type AccountSummaryResponse = { summary: AccountSummary | null };

async function requestAccountSummary(): Promise<AccountSummary | null | undefined> {
  const response = await fetch('/api/account/summary', {
    cache: 'no-store',
    credentials: 'same-origin',
    headers: { Accept: 'application/json' },
  });

  if (response.status === 401) return null;
  if (!response.ok) return undefined;

  const payload = (await response.json()) as AccountSummaryResponse;
  return payload.summary;
}

export function useAccountSummary(initialSummary: AccountSummary | null = null) {
  const [summary, setSummary] = useState<AccountSummary | null>(initialSummary);

  const reload = useCallback(async () => {
    const nextSummary = await requestAccountSummary();
    if (nextSummary !== undefined) setSummary(nextSummary);
  }, []);

  useEffect(() => {
    let cancelled = false;
    void requestAccountSummary().then((nextSummary) => {
      if (!cancelled && nextSummary !== undefined) setSummary(nextSummary);
    });

    const handleChange = (event: Event) => {
      const detail = (event as CustomEvent<AccountSummaryChangedDetail>).detail;
      if (detail && Object.hasOwn(detail, 'summary')) {
        setSummary(detail.summary ?? null);
        return;
      }
      void reload();
    };

    window.addEventListener(ACCOUNT_SUMMARY_CHANGED_EVENT, handleChange);
    return () => {
      cancelled = true;
      window.removeEventListener(ACCOUNT_SUMMARY_CHANGED_EVENT, handleChange);
    };
  }, [reload]);

  return { summary, reload };
}
