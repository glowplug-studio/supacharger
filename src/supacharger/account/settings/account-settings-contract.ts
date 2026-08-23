export type AccountNavigationExtension = {
  id: string;
  href: string;
  label: string;
  order: number;
};

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
export type AccountSettingsLayoutMode = 'managed' | 'passthrough';
