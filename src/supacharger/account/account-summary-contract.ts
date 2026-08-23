export type AccountSummary = {
  userId: string;
  email: string;
  displayName: string;
  initials: string;
  username: string | null;
  avatarPath: string | null;
  avatarUrl: string | null;
  profileHref: string;
  activeOrganisation: null | {
    id: string;
    handle: string;
    name: string;
    role: 'owner' | 'admin' | 'member';
    avatarUrl: string | null;
  };
  organisationCount: number;
};

export const ACCOUNT_SUMMARY_CHANGED_EVENT = 'supacharger:account-summary-changed';

export type AccountSummaryChangedDetail = {
  summary?: AccountSummary | null;
  reload?: boolean;
};
