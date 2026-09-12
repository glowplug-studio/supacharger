export type AccountNavigationIconName =
  | 'profile'
  | 'security'
  | 'privacy'
  | 'notifications'
  | 'billing'
  | 'organisations'
  | 'product';

export type AccountNavigationItem = {
  id: string;
  href: string;
  label: string;
  order: number;
  icon: AccountNavigationIconName | null;
};

export type AccountNavigationExtension = AccountNavigationItem;

export type AccountProfileExtensionValues = Record<string, unknown>;

export type AccountDetailsFormValues = {
  firstName: string;
  lastName: string;
  username: string;
  language: string;
  extension: AccountProfileExtensionValues;
};

export type AccountDetailsFieldErrors = Partial<Record<'firstName' | 'lastName' | 'username' | 'language' | 'extension', string>>;

export type AccountDetailsResponse =
  | {
      ok: true;
      summary: import('../account-summary-contract').AccountSummary;
    }
  | {
      ok: false;
      message: string;
      fieldErrors?: AccountDetailsFieldErrors;
    };

export type AccountDetailsPageOverride = () => React.ReactNode | Promise<React.ReactNode>;
export type AccountProfileMediaProps = {
  avatarEnabled: boolean;
  firstName: string;
  headerEnabled: boolean;
  initialAvatarPath: string | null;
  initialAvatarUrl: string | null;
  initialHeaderPath: string | null;
  initialHeaderUrl: string | null;
  lastName: string;
  username: string;
};
export type AccountSettingsLayoutMode = 'managed' | 'passthrough';
