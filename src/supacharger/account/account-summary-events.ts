'use client';

import {
  ACCOUNT_SUMMARY_CHANGED_EVENT,
  type AccountSummary,
  type AccountSummaryChangedDetail,
} from './account-summary-contract';

export function publishAccountSummaryChanged(summary?: AccountSummary | null) {
  const detail: AccountSummaryChangedDetail = summary === undefined ? { reload: true } : { summary };
  window.dispatchEvent(new CustomEvent(ACCOUNT_SUMMARY_CHANGED_EVENT, { detail }));
}
